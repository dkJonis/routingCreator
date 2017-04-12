sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/model/Filter"
], function(Controller, MessageToast, Filter) {
	"use strict";
	var oView;
	var oDialog;
	var oRoutingTable;
	var oListModel = new sap.ui.model.json.JSONModel();
	var oTableModel = new sap.ui.model.json.JSONModel();
	var oComboModel = new sap.ui.model.json.JSONModel();

	return Controller.extend("PP_Cloostermans_routing.controller.Overview", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.deklejoHelloWorld.view.App
		 */
		onInit: function() {
			oView = this.getView();
			oView.setModel(oListModel, "list");
			oView.setModel(oTableModel, "routingTable");
			oView.setModel(oComboModel, "comboTemplate");
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
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "PP_Cloostermans_routing.view.Details", this);
				// connect dialog to view (models, lifecycle)
				oView.addDependent(oDialog);
			}

			oDialog.open();
		},
		Continue: function() {
			/*if ("{MaterialNr}" === null ||"{Plant}" === null || "{Revision}" === null)
			{
				MessageToast.show("You didn't fill everything in: Material = {MaterialNr}, Plant = {Plant} and Revision is {Revision} ");
			}
			else*/

			//var oView = this.getView();
			//var oDialog = oView.byId("Details");
			var sMatnr = oView.byId("p_materialNumber").getValue();
			var sPlant = oView.byId("p_plant").getValue();
			var sRevision = oView.byId("p_revision").getValue();
			var oParamModel = new sap.ui.model.json.JSONModel({
				"matnr": sMatnr,
				"plant": sPlant,
				"revision": sRevision
			});
			oView.setModel(oParamModel, "params");

			var oWorkCenterModel = oView.getModel("Workcenter");
			//workcenters
			oWorkCenterModel.read("/Zppc_Cds_Workcenter(p_plant='" + sPlant + "')/Set", {
				success: function(oData, oResponse) {
					MessageToast.show("You have chosen material: " + sMatnr + ", plant: " + sPlant + ", revision: " + sRevision + ""); //, Plant = {Plant},  and Revision is {Revision} ");
					//var oList = oView.byId("WorkcenterList");
					//oList.bindItems(oModel);

					//oWorkCenterModel.setData(oData.results);
					oListModel.setData(oData.results);
					console.log(oData.results);
				}
			});

			//Filling of routings(in case they already exist)
			var oRoutingModel = oView.getModel("Routing");
			oRoutingModel.read("/Zppc_Cds_Routing(p_matnr='" + sMatnr + "',p_plant='" + sPlant + "')/Set", {
				success: function(oData, oResponse) {
					oTableModel.setData(oData.results);
					oRoutingTable = oView.byId("routingTable");
					oRoutingTable.setHeaderText("Operations(" + oData.results.length + ")");
					console.log(oData.results.length);
					console.log(oData.results);
				}
			});
			

			//	var items = oView.byId("Operation");
			//	items.setEditable(true);

			// Filling of Templates
			var oTemplateModel = oView.getModel("Template");
			oTemplateModel.read("/Zppc_Cds_Template", {
				success: function(oData, oResponse) {
					oComboModel.setData(oData.results);
					console.log(oData.results);
				}
			});

			oDialog.close();
			//oView.rerender();
			//this.displayRoutingsCount();
		},
		updateTableHeader: function()
		{
			oRoutingTable.setHeaderText("Operations(" + oRoutingTable.getItems().length + ")");
			console.log(oRoutingTable.getItems().length);
		},
		// TEST
		onAddToRoutings: function()
		{
			var oSelectedItem = comboTemplate.getSelectedItem
		},
		addItemToTable: function(oEvent)
		{
				//console.log(oRoutingTable.getRows());
				
				var oWorkcList = oView.byId("WorkcenterList");
				if(oWorkcList.getSelectedItem() === null)//.oBindingContexts.list.oModel);
				{
					MessageToast.show("Please select a workcenter");
				}
				console.log(oWorkcList.getSelectedItem().getBindingContext("list").getObject());
				var ID = (oWorkcList.getSelectedItem().oBindingContexts.list.sPath);//.substr(1,1);//substr(1,1);
				var oSelectedItem = oListModel.getProperty(ID);
				console.log(oSelectedItem);
				var addItem = {
					operationNumber: "00" + (oRoutingTable.getItems().length + 1) + "0",
					workcenter: oSelectedItem.workplace,
					controlKey: oSelectedItem.controlKey,
					operationDescription: oSelectedItem.description,
					setupUnit: oSelectedItem.setupUnit,
					machineUnit: oSelectedItem.machineUnit,
					laborUnit: oSelectedItem.laborUnit
				};
				console.log(addItem);
				
				//console.log(oWorkcList.getSelectedItem().getProperty(ID));
				//console.log(oView.getModel("Workcenter").getProperty(ID));
				//oRoutingTable.addItem(addItem);
				console.log(oTableModel.getData().push(addItem));
				console.log(oTableModel.getData());
			//	console.log(oRoutingTable.getItems().push(addItem));
				console.log(oRoutingTable.getItems());
				for (var x = 0; x < oTableModel.getData().length; x++)
				{
					console.log(oRoutingTable.getItems()[x]);
				}
				oTableModel.refresh(true);
				oRoutingTable.setHeaderText("Operations(" + oRoutingTable.getItems().length + ")");
		},
		ActivateEditMode: function()
		{
			console.log(oRoutingTable.getSelectedItem());
			if(oRoutingTable.getSelectedItem() === null)
			{
				MessageToast.show("You didnt select a row");
			}
			var ID = (oRoutingTable.getSelectedItem().oBindingContexts.routingTable.sPath);
			var oSelectedItem = oTableModel.getProperty(ID);
			console.log(oSelectedItem);
			//oSelectedItem.byId("setup").setEditable(false);
			//oRoutingTable.getSelectedItem().setEditable(true);

		}
		

	});
});