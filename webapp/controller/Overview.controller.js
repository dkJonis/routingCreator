/* global interact:true */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"com/flexso/routingbuilder/model/services",
	"com/flexso/routingbuilder/libs/interact"
], function(Controller, MessageToast, Filter, services, interactjs) {
	"use strict";
	var oView;
	var oRoutingTable;
	var oDialog;

	return Controller.extend("com.flexso.routingbuilder.controller.Overview", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.deklejoHelloWorld.view.App
		 */
		onInit: function() {

			oView = this.getView();
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

			oDialog = oView.byId("Details");
			// create dialog lazily
			if (!oDialog) {

				oDialog = sap.ui.xmlfragment(oView.getId(), "com.flexso.routingbuilder.view.Details", this);

				oView.addDependent(oDialog);
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
						drag: oView.byId("mainContainer"),
						endOnly: true
					},

					// call this function on every dragmove event
					onmove: dragMoveListener,
					// call this function on every dragend event
					onend: function(event) {
						
						var target = event.target;

						target.style.webkitTransform =
							target.style.transform =
							'translate(' + 0 + 'px, ' + 0 + 'px)';

						// set target position to original position
						target.setAttribute("data-x", 0);
						target.setAttribute("data-y", 0);

					}
				});

			function dragMoveListener(event) {
				var target = event.target,
					// keep the dragged position in the data-x/data-y attributes
					x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
					y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

				// translate the element
				target.style.webkitTransform =
					target.style.transform =
					'translate(' + x + 'px, ' + y + 'px)';

				// update the posiion attributes
				target.setAttribute('data-x', x);
				target.setAttribute('data-y', y);
			}

			// this is used later in the resizing and gesture demos
			window.dragMoveListener = dragMoveListener;

			interact('.dropzone').dropzone({
				// only accept elements matching this CSS selector
				accept: ".draggable",
				// Require a 75% element overlap for a drop to be possible
				overlap: 0.75,

				// listen for drop related events:

				ondropactivate: function(event) {
					// add active dropzone feedback
					event.target.classList.add('drop-active');
				},
				ondragenter: function(event) {
					var draggableElement = event.relatedTarget,
						dropzoneElement = event.target;

					// feedback the possibility of a drop
					dropzoneElement.classList.add('drop-target');
					draggableElement.classList.add('can-drop');
				},
				ondragleave: function(event) {
					// remove the drop feedback style
					event.target.classList.remove('drop-target');
					event.relatedTarget.classList.remove('can-drop');
				},
				ondrop: function(event) {
					
					var relatedTarget = oView.getModel("workcenter").getProperty("/" + event.relatedTarget.id.slice(-1));

					var addItem = {
						operationNumber: "00" + (oRoutingTable.getItems().length + 1) + "0",
						workcenter: relatedTarget.workplace,
						controlKey: relatedTarget.controlKey,
						operationDescription: relatedTarget.description,
						setupUnit: relatedTarget.setupUnit,
						machineUnit: relatedTarget.machineUnit,
						laborUnit: relatedTarget.laborUnit
					};
					that.addToRoutingTable(addItem);

				},
				ondropdeactivate: function(event) {
					// remove active dropzone feedback
					event.target.classList.remove('drop-active');
					event.target.classList.remove('drop-target');
				}
			});

			oDialog.open();
		},
		_onContinue: function() {

			var sMatnr = oView.byId("p_materialNumber").getValue();
			var sPlant = oView.byId("p_plant").getValue();
			var sRevision = oView.byId("p_revision").getValue();
			var oParamModel = new sap.ui.model.json.JSONModel({
				"matnr": sMatnr,
				"plant": sPlant,
				"revision": sRevision
			});
			oView.setModel(oParamModel, "params");

			$.when(services.getWorkcenters(sPlant)).done(function(oData) {
				oView.getModel("workcenter").setData(oData);
			});

			$.when(services.getMaterialDetails(sMatnr)).done(function(oData) {
				oView.getModel("materialDetails").setData(oData);
			});

			oRoutingTable = oView.byId("routingTable");
			var that = this;
			$.when(services.getRoutings(sMatnr, sPlant)).done(function(oData) {
				oView.getModel("routing").setData(oData);
				that.updateTableHeader();
			});

			$.when(services.getTemplates()).done(function(oData) {
				oView.getModel("template").setData(oData);
			});

			oDialog.close();

		},
		updateTableHeader: function() {
			var title = oView.byId("tableTitle");
			title.setText("Operations(" + oView.getModel("routing").getData().length + ")");
		},
		_onAddWorkcenter: function(oEvent) {
			var oWorkcList = oView.byId("WorkcenterList");
			if (oWorkcList.getSelectedItem() === null) {
				MessageToast.show("Please select a workcenter");
			}
			var oSelectedItem = oWorkcList.getSelectedItem().getBindingContext("workcenter").getObject();
			var addItem = {
				operationNumber: "00" + (oRoutingTable.getItems().length + 1) + "0",
				workcenter: oSelectedItem.workplace,
				controlKey: oSelectedItem.controlKey,
				operationDescription: oSelectedItem.description,
				setupUnit: oSelectedItem.setupUnit,
				machineUnit: oSelectedItem.machineUnit,
				laborUnit: oSelectedItem.laborUnit
			};
			this.addToRoutingTable(addItem);
		},
		_onAddTemplate: function(oEvent) //list afhandelen binnen deze functie, aantal keren de addToRoutingTable functie oproepen
			{
				var that = this;
				var oComboTemplate = oView.byId("comboTemplate");
				if (oComboTemplate.getSelectedItem() === null) {
					MessageToast.show("Please select a workcenter");
				}
				var oSelectedItem = oComboTemplate.getSelectedItem().getBindingContext("template").getObject();
				var sRoutingGroupCode = oSelectedItem.routingGroupCode;
				var sRoutingGroupCounter = oSelectedItem.routingGroupCounter;

				var overwrite = oView.byId("overwriteCheck");
				if (overwrite.getSelected() === true) {
					oView.getModel("routing").getData().splice(0, oView.getModel("routing").getData().length);
				}
				$.when(services.getTemplateItems(sRoutingGroupCounter, sRoutingGroupCode)).done(function(oData) {
					oView.getModel("templateItems").setData(oData);

					for (var x in oView.getModel("templateItems").getData()) {
						var item = oView.getModel("templateItems").getProperty("/" + x);
						if (item !== null) {
							that.addToRoutingTable(item);
						}

					}
				});
			},
		addToRoutingTable: function(addItem) {
			oView.getModel("routing").getData().push(addItem);

			oView.getModel("routing").refresh(true);
			this.updateTableHeader();
			//oRoutingTable.setHeaderText("Operations(" + oRoutingTable.getItems().length + ")");
		},
		updateOperationNumbers: function(data) {
			var teller = 1;
			var item;
			for (var x in data) {
				
				item = oView.getModel("routing").getProperty("/" + x);
				item.operationNumber = "00" + teller + "0";
				teller++;
			}
			oView.getModel("routing").setData(data);
		},
		DeleteSelectedRecord: function() {

			if (oRoutingTable.getSelectedItem() === null) {
				MessageToast.show("You didnt select a row");
			}
			var ID = (oRoutingTable.getSelectedItem().getBindingContext("routing").sPath);

			oView.getModel("routing").getData().splice(ID.substr(1, 1), 1);
			oView.getModel("routing").setData(oView.getModel("routing").getData());
			//console.log(oView.getModel("routing").getData());
			this.updateOperationNumbers(oView.getModel("routing").getData());
			this.updateTableHeader();
		},
		_onSaveRoutings: function() {
			var matDetails = oView.getModel("materialDetails");
			/*var task = {};
			//task details ( PLKO )
			//console.log(oView.byId("p_plant").getValue());
			task.plant = oView.byId("p_plant").getValue();
			task.TaskListUsage = "1";
			task.TaskListStatus = "4";
			task.TaskMeasureUnit = matDetails.getProperty("/" + 0).baseUnit;
			task.Groupcounter = "";
			console.log(matDetails);
			console.log(task);

			//MAPL
			var matTaskAllocation = {};
			matTaskAllocation.Material = oView.byId("p_materialNumber").getValue();
			matTaskAllocation.Plant = oView.byId("p_plant").getValue();
			matTaskAllocation.ValidFrom = new Date();
			console.log(matTaskAllocation);*/

			//PLPO

			var operations = [];
			//console.log(oRoutingTable.getItems().mAggregations.cells.length);
			var oModel = oView.getModel();
			var operationAg = oRoutingTable.getAggregation("items");
			//oView.getModel("routing").refresh(true);
			for (var i = 0; i < oView.getModel("routing").getData().length; i++) {
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
				}*/

				singleOperation.OperationMeasureUnit = matDetails.getProperty("/" + 0).baseUnit;
				singleOperation.WorkCntr = operationDetails[1].getProperty("text");
				singleOperation.ControlKey = operationDetails[2].getProperty("value");
				singleOperation.Activity = operationDetails[0].getProperty("text");
				singleOperation.ValidFrom = new Date();
				singleOperation.Description = operationDetails[3].getProperty("value");
				singleOperation.BaseQuantity = operationDetails[4].getProperty("value");
				singleOperation.Plant = oView.byId("p_plant").getValue();
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
			createData.Material = oView.byId("p_materialNumber").getValue();
			//singleOperation.Groupcounter = "01";
			createData.Plant = oView.byId("p_plant").getValue();
			createData.TaskListUsage = "1";
			createData.TaskListStatus = "4";
			createData.TaskMeasureUnit = matDetails.getProperty("/" + 0).baseUnit;
			createData.toOperations = operations;

			// Hier gebeurt nog iets raar, record wordt wel aangepast,... maar toch krijg ik de messageToast van de error function.
			oModel.create("/routingCreateSet", createData, {
				success: function(oData) {
					MessageToast.show("Saved " + operations.length);
				},
				error: function(err) {
					MessageToast.show("Nothing has been created");
				}
			});

		},
		_onCancel: function() {
			//setten van verschillende json models op null

			oView.byId("p_materialNumber").setValue("");
			oView.byId("p_plant").setValue("");
			oView.byId("p_revision").setValue("");
			oView.getModel("workcenter").setData(null);
			oView.getModel("routing").setData(null);
			oView.getModel("template").setData(null);
			oView.getModel("params").setData(null);
			oView.getModel("materialDetails").setData(null);

			//heropenen dialog.
			oDialog.open();
		}

	});
});