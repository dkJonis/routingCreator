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
		continue: function() {

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
			oRoutingTable.setHeaderText("Operations(" + oRoutingTable.getItems().length + ")");
			console.log(oRoutingTable.getItems().length);
		},
		// TEST
		addTemplate: function() {
			var templateID = oView.byId("comboTemplate").getSelectedItem().getBindingContext("template").sPath;
			console.log(templateID);
			var oSelectedItem = oView.getModel("template").getProperty(templateID);
			console.log(oSelectedItem);
			var sRoutingGroupCode = oSelectedItem.routingGroupCode;
			var sRoutingGroupCounter = oSelectedItem.routingGroupCounter;
			console.log(oSelectedItem.routingGroupCounter);
			
			$.when(services.getTemplateItems(sRoutingGroupCounter, sRoutingGroupCode)).done(function(oData) {
				oView.getModel("templateItems").setData(oData);
				//addToRoutingTable
			});
			
			console.log(oView.getModel("templateItems"));
			console.log(oView.getModel("templateItems").getData());
			
		},
		_onAddWorkcenter: function(oEvent)
		{
			var oWorkcList = oView.byId("WorkcenterList");
			if (oWorkcList.getSelectedItem() === null) 
			{
				MessageToast.show("Please select a workcenter");
			}
			var oSelectedItem = oWorkcList.getSelectedItem().getBindingContext("workcenter").getObject();
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
			this.addToRoutingTable(addItem);
		},
		_onAddTemplate: function(oEvent) //list afhandelen binnen deze functie, aantal keren de addToRoutingTable functie oproepen
		{
			var that = this;
			var oComboTemplate = oView.byId("comboTemplate");
			if(oComboTemplate.getSelectedItem() === null)
			{
				MessageToast.show("Please select a workcenter");
			}
			var oSelectedItem = oComboTemplate.getSelectedItem().getBindingContext("template").getObject();
			var sRoutingGroupCode = oSelectedItem.routingGroupCode;
			var sRoutingGroupCounter = oSelectedItem.routingGroupCounter;
			
			$.when(services.getTemplateItems(sRoutingGroupCounter, sRoutingGroupCode)).done(function(oData) {
				oView.getModel("templateItems").setData(oData);
				
				for(var x in oView.getModel("templateItems").getData())
				{
					var item = oView.getModel("templateItems").getProperty("/" + x);
					console.log(item);
					if(item !== null)
					{
						//console.log(item);
						//addToRoutingTable(item);
						that.addToRoutingTable(item);
					}
					
				}
			});
		},
		addToRoutingTable: function(addItem)
		{
			oView.getModel("routing").getData().push(addItem);
			
			oView.getModel("routing").refresh(true);
			oRoutingTable.setHeaderText("Operations(" + oRoutingTable.getItems().length + ")");
		},
		updateOperationNumbers: function(data)
		{
			var teller = 1;
			var item;
			for(var x in data)
			{
				/*if(x === 0)
				{
					item = oView.getModel("routing").getProperty("/" + 0);
					item.operationNumber = "00" + teller + "0";
					console.log(item);
				}
				else if(x !== 0) {*/
				item = oView.getModel("routing").getProperty("/" + x);
				item.operationNumber = "00" + teller + "0";
				//x.operationNumber =  "00" + teller + "0";
			//}
				teller++;
			}
			oView.getModel("routing").setData(data);
			oView.getModel("routing").refresh(true);
		},
		DeleteSelectedRecord: function() {
			
			if (oRoutingTable.getSelectedItem() === null) {
				MessageToast.show("You didnt select a row");
			}
			var ID = (oRoutingTable.getSelectedItem().getBindingContext("routing").sPath);
			
			oView.getModel("routing").getData().splice(ID.substr(1,1),1);
			oView.getModel("routing").setData(oView.getModel("routing").getData());
			//console.log(oView.getModel("routing").getData());
			this.updateOperationNumbers(oView.getModel("routing").getData());
			oView.getModel("routing").refresh(true);
			this.updateTableHeader();

		}

	});
});