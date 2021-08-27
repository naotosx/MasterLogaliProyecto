// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/base/Log"
], function (Controller, JSONModel, Filter, FilterOperator, Log) {
    return Controller.extend("MasterLogali.GestionEmpleados.controller.VerEmpleado", {

        onInit : function() {
            this.splitContainer = this.byId("SplitContDemo");
            this.splitContainer.to(this.byId("seleccionEmpleado"));
        },

        _getSplitContObj: function () {
			var result = this.byId("SplitContDemo");
			if (!result) {
				Log.error("SplitApp object can't be found");
			}
			return result;
        },
        
        _showError : function(e) {
            sap.m.MessageToast.show(JSON.parse(e.responseText).error.message.value);
        },

        onShowItemDetail:function(oEvent) {
            var oData = oEvent.getSource().getBindingContext("odataModel").getObject();
            this._getSplitContObj().to(this.createId("detail"));
            this.byId("detail").bindElement("odataModel>/Users(EmployeeId='" + oData.EmployeeId + "',SapId='" + this.getOwnerComponent().SapId + "')");
		    this.employeeId = oData.EmployeeId;
            
            //Trae archivos vinculados al empleado
            this.byId("uploadColletion").bindAggregation("items", {
                path: "odataModel>/Attachments",
                filters: [
                    new Filter("SapId",FilterOperator.EQ, this.getOwnerComponent().SapId),
                    new Filter("EmployeeId",FilterOperator.EQ, oData.EmployeeId)
                ],
                template: new sap.m.UploadCollectionItem({
                    documentId: "{odataModel>AttId}",
                    fileName: "{odataModel>DocName}",
                    visibleEdit: false
                }).attachPress(this.downloadFile)
            });
        },

        onGoHome: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("Main", true);
        },

        onSearch: function (oEvent) {
			// add filter for search
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
                var f1 = new Filter("FirstName", FilterOperator.Contains, sQuery)
                aFilters.push(f1);
			}
			// update list binding
			var oList = this.byId("listMaster");
			var oBinding = oList.getBinding("items");
			oBinding.filter(aFilters, "Application");
        },
        
        // -------------Funciones para eliminar empleado y ascender $$$ --------------//
        onDarBaja: function(oEvent) {
            // Sé que debí usar un information pero me parece que eliminar un empleado es mas importante que un mensaje informativo yo lo usaría para algo mas nimeo
            var oResourceBundle = this.oView.getModel("i18n").getResourceBundle();
            var sPath = oEvent.getSource().getBindingContext("odataModel");
            var data = sPath.getObject();

            sap.m.MessageBox.warning(oResourceBundle.getText("askDelete"),{
                onClose : function(oAction){
                    if(oAction === "OK"){
                        this.getView().getModel("odataModel").remove(sPath.getPath(), {
                            success: function(dat) {
                                sap.m.MessageBox.success(oResourceBundle.getText("deletedOK", [data.FirstName, data.LastName]));
                                this.splitContainer.to(this.createId("seleccionEmpleado"));
                            }.bind(this),
                            error : function(e) {
                                this._showError(e);
                            }.bind(this)
                        })
                    }
                }.bind(this)
            });
        },
        onAscender: function(oEvent) {
            if(!this.ascenderFragment){
                this.ascenderFragment = sap.ui.xmlfragment("MasterLogali/GestionEmpleados/view/fragments/ascenderEmpleado", this);
                this.getView().addDependent(this.ascenderFragment);
            }
            this.ascenderFragment.setModel(new sap.ui.model.json.JSONModel({}),"modelData");
            this.ascenderFragment.open();
        },

        onAumentarSalario : function(oEvent) {
            // Pensé en limitar el aumento por el tipo de empleado pero no se si hay limite para aumentos o si habria aumentos temporales
            var oData = this.ascenderFragment.getModel("modelData").getData();
            if ( oData.salario !== "" && oData.fecha !== undefined) {
                this._setUpdateSalary(oData);
            } else {

                if ( oData.salario === undefined || oData.salario === "" ) {
                    this.ascenderFragment.getModel("modelData").setProperty("/valueStatus", sap.ui.core.ValueState.Error);
                } else {
                    this.ascenderFragment.getModel("modelData").setProperty("/valueStatus", sap.ui.core.ValueState.None);
                }

                if ( oData.fecha === undefined || oData.fecha === null ) {
                    this.ascenderFragment.getModel("modelData").setProperty("/valueStatusDate", sap.ui.core.ValueState.Error) 
                } else {
                    this.ascenderFragment.getModel("modelData").setProperty("/valueStatusDate", sap.ui.core.ValueState.None);
                }
            }
        },

        _setUpdateSalary : function(odata) {
            var body = {
                Ammount : odata.salario,
                CreationDate : odata.fecha,
                Comments : odata.Comments,
                SapId : this.getOwnerComponent().SapId,
                EmployeeId : this.employeeId
            };

            this.getView().setBusy(true);
            this.getView().getModel("odataModel").create("/Salaries",body,{
                success : function(){
                    this.getView().setBusy(false);
                    this.onCloseAscender();
                    sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("ascensoCorrectamente"));
                }.bind(this),
                error : function(e){
                    this.getView().setBusy(false);
                    this._showError(e);
                }.bind(this)
            });
        },
        
        onCloseAscender : function(){
            this.ascenderFragment.close();
        },

        // --------------Funciones para el uploadcollection---------------//
        onFileChange: function(oEvent) {
            //Agregamos el parametro token al archivo
            var oUploader = oEvent.getSource();
            var oToken = new sap.m.UploadCollectionParameter({
                name: "x-csrf-token",
                value: this.getView().getModel("odataModel").getSecurityToken(),
            });
            oUploader.addHeaderParameter(oToken);
        },
        onFileUploadComplete: function(oEvent) {
            // Refrescamos tabla de archivos
            oEvent.getSource().getBinding("items").refresh();
        },
        onFileBeforeUpload: function(oEvent) {
            var fileName = oEvent.getParameter("fileName");
            var objContext = oEvent.getSource().getBindingContext("odataModel").getObject();
            var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
                name : "slug",
                value: this.getOwnerComponent().SapId + ";" + objContext.EmployeeId + ";" + fileName
            });
            oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
        },
        onFileDeleted: function(oEvent) {
            var oUploadCollection = oEvent.getSource();
            var sPath = oEvent.getParameter("item").getBindingContext("odataModel").getPath();
            this.getView().getModel("odataModel").remove(sPath, {
                success: function() {
                    oUploadCollection.getBinding("items").refresh();
                }.bind(this),
                error: function(e) {
                    this._showError(e);
                }.bind(this)
            });
        },
        downloadFile : function(oEvent) {
            var sPath = oEvent.getSource().getBindingContext("odataModel").getPath();
            window.open("/sap/opu/odata/sap/ZEMPLOYEES_SRV" + sPath + "/$value");
        }


    });
});