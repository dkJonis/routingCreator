sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"com/flexso/routingbuilder/model/services"
], function(Controller, MessageToast, Filter, services) {
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

			oDialog.open();
		},
		Continue: function() {

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
			
			oRoutingTable = oView.byId("routingTable");
			$.when(services.getRoutings(sMatnr, sPlant)).done(function(oData) {
				oView.getModel("routing").setData(oData);
			});
			
			$.when(services.getTemplates()).done(function(oData) {
				oView.getModel("template").setData(oData);
			});


			oDialog.close();

		},
		updateTableHeader: function() {
			oView.getModel("routing").setHeaderText("Operations(" + oView.getModel("routing").getItems().length + ")");
			console.log(oView.getModel("routing").getItems().length);
		},
		// TEST
		onAddToRoutings: function() {
			var oSelectedItem = oView.getModel("template").getSelectedItem
		},
		addItemToTable: function(oEvent) {

			var oWorkcList = oView.byId("WorkcenterList");
			if (oWorkcList.getSelectedItem() === null) 
			{
				MessageToast.show("Please select a workcenter");
			}
			console.log(oWorkcList.getSelectedItem().getBindingContext("workcenter").sPath);
			var ID = (oWorkcList.getSelectedItem().getBindingContext("workcenter").sPath); //.substr(1,1);//substr(1,1);
			var oSelectedItem = oView.getModel("workcenter").getProperty(ID);
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


			oView.getModel("routing").getData().push(addItem);
			
			oView.getModel("routing").refresh(true);
			oRoutingTable.setHeaderText("Operations(" + oRoutingTable.getItems().length + ")");
		},
		updateOperationNumbers: function(data)
		{
			console.log(data)
		},
		DeleteSelectedRecord: function() {
			
			if (oRoutingTable.getSelectedItem() === null) {
				MessageToast.show("You didnt select a row");
			}
			var ID = (oRoutingTable.getSelectedItem().getBindingContext("routing").sPath);
			
			oView.getModel("routing").getData().splice(ID.substr(1,1),1);
			oView.getModel("routing").setData(oView.getModel("routing").getData());
			this.updateOperationNumbers(oView.getModel("routing").getData());
			oView.getModel("routing").refresh(true);


		}

	});
});