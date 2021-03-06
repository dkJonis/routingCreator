sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/odata/ODataModel"
], function(Object, ODataModel) {
	"use strict";
	var services = Object.extend("com.flexso.routingbuilder.services", {

		constructor: function() {

		},

		setModel: function(oModel) {
			this.model = oModel;
		},

		//Functies voor alle interacties met de ODATA service

		//….

		getWorkcenters: function(sPlant) {
			
			var d = $.Deferred();
			this.model.read("/Zppc_Cds_Workcenter(p_plant='" + sPlant + "')/Set", {
				success: function(oData) {
					d.resolve(oData.results);
				}
			});
			return d.promise();
		},
		getRoutings: function(sMatnr, sPlant, sRevlv) {
			
			var d = $.Deferred();
			
			this.model.read("/Zppc_Cds_Routing(p_matnr='" + sMatnr + "',p_plant='" + sPlant + "')/Set", {
				success: function(oData){
					d.resolve(oData.results);
				}
			});
			return d.promise();
		},
		getTemplates: function() {
			
			var d = $.Deferred();
			
			this.model.read("/Zppc_Cds_Template", {
				success: function(oData)
				{
					d.resolve(oData.results);
				}
			});
			return d.promise();
		},
		getTemplateItems: function(counter, routingCode) {
			
			var d = $.Deferred();
			
			this.model.read("/Zppc_Cds_Templateitems(p_counter='" + counter + "',p_routingCode='" + routingCode + "')/Set", {
				success: function(oData)
				{
					d.resolve(oData.results);
				}
			});
			return d.promise(); 
		},
		getMaterialDetails: function(matnr) {
			
			var d = $.Deferred();
			
			this.model.read("/ZPPC_MATERIALDETAILS(p_matnr='" + matnr + "')/Set", {
				success: function(oData)
				{
					d.resolve(oData.results);
				}
			});
			return d.promise(); 
		},
		saveRoutings: function(createData) {
			var d = $.Deferred();
			
			this.model.create("/routingCreateSet", createData, {
				success: function(oData) 
				{
					d.resolve(oData, true);
				},
				error: function(oData)
				{
					d.resolve(oData, false);
				}
			});
			return d.promise(); 
		}
	});
	
	var instance = new services();
	return instance;
});