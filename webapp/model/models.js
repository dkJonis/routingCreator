sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createWorkcenterModel: function() {
			var oModel = new JSONModel();
			oModel.setDefaultBindingMode("OneTime");
			return oModel;
		},
		createRoutingModel: function() {
			var oModel = new JSONModel();
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		createTemplateModel: function() {
			var oModel = new JSONModel();
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		}

	};
});