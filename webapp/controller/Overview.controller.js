/* global interact:true */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"com/flexso/routingbuilder/model/services",
	"com/flexso/routingbuilder/libs/interact"
], function(Controller, MessageToast, Filter, services, interactjs) {
	"use strict";

	return Controller.extend("com.flexso.routingbuilder.controller.Overview", {
		// global variables
		_oView: null,
		_oRoutingTable: null,
		_oDialog: null,


		/* --------------------------------------------------------------- */
		/* -                      LIFECYCLE METHODS                      - */
		/* --------------------------------------------------------------- */
		
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.deklejoHelloWorld.view.App
		 */
		onInit: function() {

			this._oView = this.getView();
			var that = this;
			this.getOwnerComponent().getModel().metadataLoaded().then(function(oEvent) {
				services.setModel(that.getOwnerComponent().getModel());
			});
			

		},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf PP_Cloostermans_routing.view.app
		 */
		onAfterRendering: function() {

			this._oDialog = this._oView.byId("Details");
			// create dialog lazily
			if (!this._oDialog) {

				this._oDialog = sap.ui.xmlfragment(this._oView.getId(), "com.flexso.routingbuilder.view.Details", this);

				this._oView.addDependent(this._oDialog);
			}
			var that = this;

			// interactjs
			interact(".draggable")
				.draggable({
					// enable inertial throwing
					inertia: false,
					// keep the element within the area of it's parent
					restrict: {
						//restriction: "parent",
						drag: this._oView.byId("mainContainer"),
						endOnly: true
					},

					// call this function on every dragmove event
					onmove: dragMoveListener,
					// call this function on every dragend event
					onend: function(event) {

						var oTarget = event.target;

						oTarget.style.webkitTransform =
							oTarget.style.transform =
							'translate(' + 0 + 'px, ' + 0 + 'px)';

						// set target position to original position
						oTarget.setAttribute("data-x", 0);
						oTarget.setAttribute("data-y", 0);

					}
				});

			function dragMoveListener(event) {
				var oTarget = event.target,
					// keep the dragged position in the data-x/data-y attributes
					x = (parseFloat(oTarget.getAttribute('data-x')) || 0) + event.dx,
					y = (parseFloat(oTarget.getAttribute('data-y')) || 0) + event.dy;

				// translate the element
				oTarget.style.webkitTransform =
					oTarget.style.transform =
					'translate(' + x + 'px, ' + y + 'px)';

				// update the posiion attributes
				oTarget.setAttribute('data-x', x);
				oTarget.setAttribute('data-y', y);
			}

			// this is used later in the resizing and gesture demos
			window.dragMoveListener = dragMoveListener;

			interact('.dropzone').dropzone({
				// only accept elements matching this CSS selector
				accept: '.draggable',
				// Require a 75% element overlap for a drop to be possible
				overlap: 0.75,

				// listen for drop related events:

				ondropactivate: function(event) {
					// add active dropzone feedback
					event.target.classList.add("drop-active");
				},
				ondragenter: function(event) {
					var draggableElement = event.relatedTarget,
						dropzoneElement = event.target;

					// feedback the possibility of a drop
					dropzoneElement.classList.add("drop-target");
					draggableElement.classList.add("can-drop");
				},
				ondragleave: function(event) {
					// remove the drop feedback style
					event.target.classList.remove("drop-target");
					event.relatedTarget.classList.remove("can-drop");
				},
				ondrop: function(event) {

					var oRelatedTarget = that._oView.getModel("workcenter").getProperty("/" + event.relatedTarget.id.slice(-1));
					
					var opnr = that._oView.getModel("i18n").getResourceBundle().getText("operationNumber", [that._oRoutingTable.getItems().length + 1]);
					console.log(opnr);
					var addItem = {
						operationNumber: "00" + (that._oRoutingTable.getItems().length + 1) + "0",
						workcenter: oRelatedTarget.workplace,
						controlKey: oRelatedTarget.controlKey,
						operationDescription: oRelatedTarget.description,
						setupUnit: oRelatedTarget.setupUnit,
						machineUnit: oRelatedTarget.machineUnit,
						laborUnit: oRelatedTarget.laborUnit
					};
					console.log(addItem);
					that._addToRoutingTable(addItem);

				},
				ondropdeactivate: function(event) {
					// remove active dropzone feedback
					event.target.classList.remove('drop-active');
					event.target.classList.remove('drop-target');
				}
			});

			this._oDialog.open();
		},
		
		/* --------------------------------------------------------------- */
		/* -                       EVENT HANDLERS                        - */
		/* --------------------------------------------------------------- */
		
		/**
		 * reads data from corresponding CDS views and fills them in JSON models
		 * @public
		 * Returns no specific data and doesnt need any particular param
		 */

		onContinue: function() {

			var sMatnr = this._oView.byId("p_materialNumber").getValue();
			var sPlant = this._oView.byId("p_plant").getValue();
			var sRevision = this._oView.byId("p_revision").getValue();
			var that = this;
			var oParamModel = new sap.ui.model.json.JSONModel({
				"matnr": sMatnr,
				"plant": sPlant,
				"revision": sRevision
			});
			this._oView.setModel(oParamModel, "params");

			$.when(services.getWorkcenters(sPlant)).done(function(oData) {
				that._oView.getModel("workcenter").setData(oData);
			});

			$.when(services.getMaterialDetails(sMatnr)).done(function(oData) {
				that._oView.getModel("materialDetails").setData(oData);
			});

			this._oRoutingTable = this._oView.byId("routingTable");
			$.when(services.getRoutings(sMatnr.toUpperCase(), sPlant)).done(function(oData) {
				that._oView.getModel("routing").setData(oData);
				var sorter = new sap.ui.model.Sorter("operationNumber", false);
				that._oRoutingTable.getBinding("items").sort(sorter);
				that._updateTableHeader();

			});

			$.when(services.getTemplates()).done(function(oData) {
				that._oView.getModel("template").setData(oData);
			});
			
			this._oDialog.close();
		},
		
		/**
		 * adds selected workcenter in routing table
		 * @public
		 * @param {object} <<addItem>> an object with all the data needed that have to be displayed in the table
		 */

		onAddWorkcenter: function() {
			var oWorkcList = this._oView.byId("WorkcenterList");
			if (oWorkcList.getSelectedItem() === null) {
				MessageToast.show("Please select a workcenter");
			}
			var oSelectedItem = oWorkcList.getSelectedItem().getBindingContext("workcenter").getObject();
			var addItem = {
				operationNumber: "00" + (this._oRoutingTable.getItems().length + 1) + "0",
				workcenter: oSelectedItem.workplace,
				controlKey: oSelectedItem.controlKey,
				operationDescription: oSelectedItem.description,
				setupUnit: oSelectedItem.setupUnit,
				machineUnit: oSelectedItem.machineUnit,
				laborUnit: oSelectedItem.laborUnit
			};
			this._addToRoutingTable(addItem);
		},
		
		/**
		 * adds the corresponding operations that exist in a template onto the routing table
		 * @public
		 */
		
		onAddTemplate: function() //list afhandelen binnen deze functie, aantal keren de addToRoutingTable functie oproepen
			{
				var that = this;
				var oComboTemplate = this._oView.byId("comboTemplate");
				if (oComboTemplate.getSelectedItem() === null) {
					MessageToast.show("Please select a workcenter");
				}
				var oSelectedItem = oComboTemplate.getSelectedItem().getBindingContext("template").getObject();
				var sRoutingGroupCode = oSelectedItem.routingGroupCode;
				var sRoutingGroupCounter = oSelectedItem.routingGroupCounter;

				var overwrite = this._oView.byId("overwriteCheck");
				if (overwrite.getSelected() === true) {
					that._oView.getModel("routing").getData().splice(0, this._oView.getModel("routing").getData().length);
				}
				$.when(services.getTemplateItems(sRoutingGroupCounter, sRoutingGroupCode)).done(function(oData) {
					that._oView.getModel("templateItems").setData(oData);

					for (var x in that._oView.getModel("templateItems").getData()) {
						var item = that._oView.getModel("templateItems").getProperty("/" + x);
						if (item !== null) {
							that._addToRoutingTable(item);
						}

					}
				});
			},
		
		/**
		 * deletes the selected row in the routing table
		 * onSave will make the deleted row flagged for 'delete'
		 * @public
		 * @param {object} <<addItem>> an object with all the data needed that have to be displayed in the table
		 */
		
		deleteSelectedRecord: function() {

			if (this._oRoutingTable.getSelectedItem() === null) {
				MessageToast.show("You didnt select a row");
			}
			var ID = (this._oRoutingTable.getSelectedItem().getBindingContext("routing").sPath);

			this._oView.getModel("routing").getData().splice(ID.substr(1, 1), 1);
			this._oView.getModel("routing").setData(this._oView.getModel("routing").getData());
			//console.log(oView.getModel("routing").getData());
			this._updateOperationNumbers(this._oView.getModel("routing").getData());
			this._updateTableHeader();
		},
		
		/**
		 * delete already existing records in the db get flagged for 'delete'
		 * + the existing rows in the table get modified so they are not flagged for 'delete' and are still present
		 * @public
		 */
		
		onSaveRoutings: function() {
			/*var matDetails = this._oView.getModel("materialDetails");

			var operations = [];
			//console.log(oRoutingTable.getItems().mAggregations.cells.length);
			var oModel = this._oView.getModel();
			var operationAg = this._oRoutingTable.getAggregation("items");
			//oView.getModel("routing").refresh(true);
			for (var i = 0; i < this._oView.getModel("routing").getData().length; i++) {
				var singleOperation = {};
				var operationDetails = operationAg[i].getAggregation("cells");

				// Data which has to be null in case its a new record that has to be created!!!
				singleOperation.TaskListGroup = operationAg[i].getBindingContext("routing").getObject().routingGroupCode;
				singleOperation.GroupCounter = operationAg[i].getBindingContext("routing").getObject().routingGroupCounter;
				//console.log(singleOperation.TaskListGroup);
				//console.log(singleOperation.GroupCounter);

				/*if( singleOperation.TaskListGroup !== null && singleOperation.GroupCounter !== null)
				{
					// nog testen
					oModel.remove("/routingCreateSet", singleOperation.TaskListGroup, singleOperation.GroupCounter, i);
				}

				singleOperation.OperationMeasureUnit = matDetails.getProperty("/" + 0).baseUnit;
				singleOperation.WorkCntr = operationDetails[1].getProperty("text");
				singleOperation.ControlKey = operationDetails[2].getProperty("value");
				singleOperation.Activity = operationDetails[0].getProperty("text");
				singleOperation.ValidFrom = new Date();
				singleOperation.Description = operationDetails[3].getProperty("value");
				singleOperation.BaseQuantity = operationDetails[4].getProperty("value");
				singleOperation.Plant = this._oView.byId("p_plant").getValue();
				//singleOperation.baseUnit = matDetails.getProperty("/" + 0).baseUnit;
				singleOperation.SetupTime = operationDetails[5].getProperty("value");
				singleOperation.SetupUnit = operationDetails[5].getProperty("description");
				singleOperation.MachineTime = operationDetails[6].getProperty("value");
				singleOperation.MachineUnit = operationDetails[6].getProperty("description");
				singleOperation.LaborTime = operationDetails[7].getProperty("value");
				singleOperation.LaborUnit = operationDetails[7].getProperty("description");

				if (singleOperation.LaborUnit === null) {
					singleOperation.LaborUnit = operationDetails[5].getProperty("description");
				}
				if (singleOperation.MachineUnit === null) {
					singleOperation.MachineUnit = operationDetails[5].getProperty("description");
				}

				operations.push(singleOperation);

			}
			// uiteindelijk object dat doorgegeven wordt aan de create functionaliteiten binnen de ODATA
			var createData = {};
			createData.Material = this._oView.byId("p_materialNumber").getValue();
			//singleOperation.Groupcounter = "01";
			createData.Plant = this._oView.byId("p_plant").getValue();
			createData.TaskListUsage = "1";
			createData.TaskListStatus = "4";
			createData.TaskMeasureUnit = matDetails.getProperty("/" + 0).baseUnit;
			createData.toOperations = operations;
			//this._setCreateData();
			var that = this;
			console.log(createData);
			// Hier gebeurt nog iets raar, record wordt wel aangepast,... maar toch krijg ik de messageToast van de error function.
			oModel.create("/routingCreateSet", createData, {
				success: function(oData) {
					that.onCancel();
					MessageToast.show("You successfully modified/created " + operations.length + " operations.");

				},
				error: function(err) {
					//MessageToast.show("Nothing has been created");
					that.onCancel();
					MessageToast.show("error occured");
				}
			});*/
			var that = this;
			$.when(services.saveRoutings(this._setCreateData())).done(function(oData, check) {
				if(check === true)
				{
					that.onCancel();
					MessageToast.show("Modified/created successfully"); 
				}
				else
				{
					that.onCancel();
					MessageToast.show("An error has occurred");
				}
			});

		},
		
		/**
		 * cancel the current material's changes and reopen dialog for next item
		 * @public
		 */
		
		onCancel: function() {
			//setten van verschillende json models op null

			this._oView.byId("p_materialNumber").setValue("");
			this._oView.byId("p_plant").setValue("");
			this._oView.byId("p_revision").setValue("");
			this._oView.getModel("workcenter").setData(null);
			this._oView.getModel("routing").setData(null);
			this._oView.getModel("template").setData(null);
			this._oView.getModel("params").setData(null);
			this._oView.getModel("materialDetails").setData(null);

			//heropenen dialog.
			this._oDialog.open();
		},
		
		/* --------------------------------------------------------------- */
		/* -                      INTERNAL METHODS                       - */
		/* --------------------------------------------------------------- */
		
		/**
		 * Updates the tableheader above the operations table to show the amount of operations currently in the table for 1 material
		 * @private
		 */
		
		_updateTableHeader: function() {
			var title = this._oView.byId("tableTitle");
			title.setText("Operations(" + this._oView.getModel("routing").getData().length + ")");
		},
		
		/**
		 * add the parameter addItem onto the routing table displayed on the web page
		 * @private
		 * @param {object} <<addItem>> an object with all the data needed that have to be displayed in the table
		 */
		
	_addToRoutingTable: function(addItem) {
			this._oView.getModel("routing").getData().push(addItem);

			this._oView.getModel("routing").refresh(true);
			this._updateTableHeader();
			//oRoutingTable.setHeaderText("Operations(" + oRoutingTable.getItems().length + ")");
		},
		
		/**
		 * updates each rows operation number in the routing table based on the amount of rows already existing in the table
		 * @private
		 * @param {sap.ui.model.json data} <<data>> the data consisting the records currently in the table
		 */
		
		_updateOperationNumbers: function(data) {
			var teller = 1;
			var item;
			for (var x in data) {

				item = this._oView.getModel("routing").getProperty("/" + x);
				item.operationNumber = "00" + teller + "0";
				teller++;
			}
			this._oView.getModel("routing").setData(data);
		},
		
		/**
		 * creates the object used for the create function inside the onSaveRoutings
		 * @private
		 */
		
		_setCreateData: function()
		{
			var matDetails = this._oView.getModel("materialDetails");

			var operations = [];
			console.log(this._oRoutingTable.getItems());
			console.log(this._oView.getModel("routing").getData());
			var oModel = this._oView.getModel();
			var operationAg = this._oRoutingTable.getAggregation("items");
			//oView.getModel("routing").refresh(true);
			for (var i = 0; i < this._oView.getModel("routing").getData().length; i++) {
				var singleOperation = {};
				var operationDetails = operationAg[i].getAggregation("cells");

				// Data which has to be null in case its a new record that has to be created!!!
				singleOperation.TaskListGroup = operationAg[i].getBindingContext("routing").getObject().routingGroupCode;
				singleOperation.GroupCounter = operationAg[i].getBindingContext("routing").getObject().routingGroupCounter;
				console.log(singleOperation.TaskListGroup);
				console.log(singleOperation.GroupCounter);

				/*if( singleOperation.TaskListGroup !== null && singleOperation.GroupCounter !== null)
				{
					// nog testen
					oModel.remove("/routingCreateSet", singleOperation.TaskListGroup, singleOperation.GroupCounter, i);
				}*/

				singleOperation.OperationMeasureUnit = matDetails.getProperty("/" + 0).baseUnit;
				singleOperation.WorkCntr = operationDetails[1].getProperty("text");
				singleOperation.ControlKey = operationDetails[2].getProperty("value");
				singleOperation.Activity = operationDetails[0].getProperty("text");
				singleOperation.ValidFrom = new Date();
				singleOperation.Description = operationDetails[3].getProperty("value");
				singleOperation.BaseQuantity = operationDetails[4].getProperty("value");
				singleOperation.Plant = this._oView.byId("p_plant").getValue();
				//singleOperation.baseUnit = matDetails.getProperty("/" + 0).baseUnit;
				singleOperation.SetupTime = operationDetails[5].getProperty("value");
				singleOperation.SetupUnit = operationDetails[5].getProperty("description");
				singleOperation.MachineTime = operationDetails[6].getProperty("value");
				singleOperation.MachineUnit = operationDetails[6].getProperty("description");
				singleOperation.LaborTime = operationDetails[7].getProperty("value");
				singleOperation.LaborUnit = operationDetails[7].getProperty("description");

				if (singleOperation.LaborUnit === null) {
					singleOperation.LaborUnit = operationDetails[5].getProperty("description");
				}
				if (singleOperation.MachineUnit === null) {
					singleOperation.MachineUnit = operationDetails[5].getProperty("description");
				}

				operations.push(singleOperation);

			}
			// uiteindelijk object dat doorgegeven wordt aan de create functionaliteiten binnen de ODATA
			var createData = {};
			createData.Material = this._oView.byId("p_materialNumber").getValue();
			//singleOperation.Groupcounter = "01";
			createData.Plant = this._oView.byId("p_plant").getValue();
			createData.TaskListUsage = "1";
			createData.TaskListStatus = "4";
			createData.TaskMeasureUnit = matDetails.getProperty("/" + 0).baseUnit;
			createData.toOperations = operations;
			console.log(createData);
			
			return createData;
		}

	});
});