sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/odata/ODataModel"
], function(Object, ODataModel) {
	"use strict";
	var instance;
	var sPlant;
	var sMatnr;
	var services = Object.extend("com.flexso.routingbuilder.services", {

		constructor: function() {
			sPlant = this.getView().byId("p_plant").getValue();
			sMatnr = this.getView().byId("p_matnr").getValue();
		},

		setModel: function(oModel) {
			this.model = oModel;
		},

		//Functies voor alle interacties met de ODATA service

		//….

		getWorkcenters: function() {
			
			var d = $.Deferred();

			this.model.read("/Zppc_Cds_Workcenter(p_plant='" + sPlant + "')/Set", {
				success: function(oData) {
					d.resolve(oData.results);
				}
			});
			return d.promise();
		},
		getRoutings: function() {
			
			var d = $.Deferred();
			
			this.model.read("/Zppc_Cds_Routing(p_matnr='" + sMatnr + "',p_plant='" + sPlant + "')/Set", {
				success: function(oData)
				{
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
		getTemplateItems: function() {
			
			var d = $.Deferred();
			
			this.model.read("/Zppc_Cds_Templateitems", {
				success: function(oData)
				{
					d.resolve(oData.results);
				}
			});
			return d.promise(); 
		}
	});
});