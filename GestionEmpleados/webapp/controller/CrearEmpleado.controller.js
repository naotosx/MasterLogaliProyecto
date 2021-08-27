// @ts-nocheck 
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox"
], function (Controller, History, MessageBox) {
    return Controller.extend("MasterLogali.GestionEmpleados.controller.CrearEmpleado", {
        onInit: function () {
            this._wizard = this.byId("wizard");
            this._oNavContainer = this.byId("wizardNavContainer");
            this._oWizardContentPage = this.byId("wizardContentPage");
            this.modelo;
            this.newUserCreated;

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("crearEmpleado").attachPatternMatched(this._onObjectMatched, this);
        },
        onGoHome: function () {
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle(),
                oHistory = History.getInstance(),
                sPreviousHash = oHistory.getPreviousHash();
            MessageBox.confirm(oResourceBundle.getText("msgConfirmationHome"), {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction === "OK") {
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("Main", true);
                    }
                }.bind(this)
            });
        },
        _onObjectMatched: function () {
            var modelJSON = new sap.ui.model.json.JSONModel({
                "salaryInterno": 24000,
                "salaryGerente": 70000,
                "salaryAutonomo": 400
            }),
            wizard = this.byId("wizard"),
            oFirstStep = this.byId("wizard_step1");
            this.modelo = modelJSON;
            this.getView().setModel(modelJSON);


            this._handleNavigationToStep(0);
            wizard.discardProgress(wizard.getSteps()[0]);
            oFirstStep.setValidated(false);
        },
        _handleNavigationToStep: function (iStepNumber) {
            var fnAfterNavigate = function () {
                this._wizard.goToStep(this._wizard.getSteps()[iStepNumber]);
                this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
            }.bind(this);

            this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
            this.backToWizardContent();
        },
        backToWizardContent: function () {
            this._oNavContainer.backToPage(this._oWizardContentPage.getId());
        },
        onSelectEmpleado: function (oEvent) {
            //oEvent.getSource().getAggregation("customData")[0].getProperty("key")
            var oButton = oEvent.getSource().getProperty("text"),
                currentStep = this.byId("wizard_step1"),
                nextStep = this.byId("wizard_step2"),
                sliderSalary = this.byId("slider_salary"),
                sliderSalar2 = this.byId("slider_precioDiario"),
                oModelView = this.getView().getModel();

            oModelView.setProperty("/isAutonomo", false);
            oModelView.setProperty("/isGerente", false);
            oModelView.setProperty("/isInterno", false);

            switch (oButton) {
                case "Interno":
                    oModelView.setProperty("/isInterno", true);
                    oModelView.setProperty("/salarioMin", 12000);
                    oModelView.setProperty("/salarioMax", 80000);
                    oModelView.setProperty("/Type", "0");
                    sliderSalary.setValue(oModelView.getProperty("/salaryInterno"));
                    break;
                case "Autónomo":
                    oModelView.setProperty("/isAutonomo", true);
                    sliderSalar2.setValue(oModelView.getProperty("/salaryAutonomo"));
                    oModelView.setProperty("/Type", "1");
                    break;
                case "Gerente":
                    oModelView.setProperty("/isGerente", true);
                    oModelView.setProperty("/salarioMin", 50000);
                    oModelView.setProperty("/salarioMax", 200000);
                    sliderSalary.setValue(oModelView.getProperty("/salaryGerente"));
                    oModelView.setProperty("/Type", "2");
                    break;
            }

            //Comparo si el ultimo step es = al primero, en caso de que no se haya ejecutado ninguno el primero es el actual
            //si el ultimo es el primero solo se ejecuta una vez el siguiente (step2) de lo contrario solo hace como un scroll al step
            if (this._wizard.getCurrentStep() === currentStep.getId()) {
                this._wizard.nextStep();
            } else {
                this._wizard.goToStep(nextStep);
            }
        },
        checkRequired: function (oEvent, returnResp) {
            /*var oInput = oEvent.getSource(), //Input a validar
                inputId = oInput.getId().split("--")[2],
                inputValue = oInput.getValue(),*/
            var data = this.modelo.getData(),
                oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                okValidations = true;

            if (data.FirstName) {
                this.byId("step2_name").setValueState(sap.ui.core.ValueState.None);
            } else {
                this.byId("step2_name").setValueState(sap.ui.core.ValueState.Error);
                this.byId("step2_name").setValueStateText(oResourceBundle.getText("minLargo"));
                okValidations = false;
            }

            if (data.LastName) {
                this.byId("step2_apellido").setValueState(sap.ui.core.ValueState.None);
            } else {
                this.byId("step2_apellido").setValueState(sap.ui.core.ValueState.Error);
                this.byId("step2_apellido").setValueStateText(oResourceBundle.getText("minLargo"));
                okValidations = false;
            }

            if (data.Dni) {
                this.byId("step2_dni").setValueState(sap.ui.core.ValueState.None);
            } else {
                this.byId("step2_dni").setValueState(sap.ui.core.ValueState.Error);
                okValidations = false;
            }

            if (data.CreationDate) {
                this.byId("datePicker").setValueState(sap.ui.core.ValueState.None);
            } else {
                this.byId("datePicker").setValueState(sap.ui.core.ValueState.Error);
                okValidations = false;
            }

            if (okValidations === true) {
                this._wizard.validateStep(this.byId("wizard_step2"));
            } else {
                this._wizard.invalidateStep(this.byId("wizard_step2"));
            }
            if(returnResp) {
                returnResp(okValidations);
            }
        },
        checkDNI: function (oEvent) {
            var dni = oEvent.getParameter("value");
            var number;
            var letter;
            var letterList;
            var regularExp = /^\d{8}[a-zA-Z]$/;
            //Se comprueba que el formato es válido
            if (regularExp.test(dni) === true) {
                //Número
                number = dni.substr(0, dni.length - 1);
                //Letra
                letter = dni.substr(dni.length - 1, 1);
                number = number % 23;
                letterList = "TRWAGMYFPDXBNJZSQVHLCKET";
                letterList = letterList.substring(number, number + 1);
                if (letterList !== letter.toUpperCase()) {
                    this.byId("step2_dni").setValueState(sap.ui.core.ValueState.Error);
                } else {
                    this.byId("step2_dni").setValueState(sap.ui.core.ValueState.None);
                    this.checkRequired();
                }
            } else {
                this.byId("step2_dni").setValueState(sap.ui.core.ValueState.Error);
            }
        },
        onFileChange : function(oEvent) {
            var oUploadCollection = oEvent.getSource();
            var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
                name : "x-csrf-token",
                value: this.getView().getModel("odataModel").getSecurityToken()
            }); 
            oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
        },
        //Añadiendo parametros del archivo en la cabecera de la peticion
        onFileBeforeUpload : function(oEvent) {
            var fileName = oEvent.getParameter("fileName");
            var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
                name : "slug",
                value: this.getOwnerComponent().SapId + ";" + this.newUserCreated + ";" + fileName
            });
            oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
        },
        onStartUpload : function (ioNum) {
            var that = this;
            var oUploadCollection = that.byId("UploadCollection");
            oUploadCollection.upload();
        },
        wizardCompletedHandler : function(oEvent) {
            this.checkRequired(oEvent,function(isValid){
			if(isValid){
                this._oNavContainer.to(this.byId("resumen"));
                
				//Se obtiene los archivos subidos
				var uploadCollection = this.byId("UploadCollection");
				var files = uploadCollection.getItems();
                var numFiles = uploadCollection.getItems().length;
                
				this.modelo.setProperty("/_numFiles",numFiles);
				if (numFiles > 0) {
					var arrayFiles = [];
					for(var i in files){
						arrayFiles.push({DocName:files[i].getFileName(),MimeType:files[i].getMimeType()});	
					}
					this.modelo.setProperty("/_files",arrayFiles);
				}else{
					this.modelo.setProperty("/_files",[]);
				}
			}else{
				this._wizard.goToStep(this.byId("dataEmployeeStep"));
			}
            }.bind(this));
        },
        editStep1: function() {
            this._handleNavigationToStep(0);
        },
        editStep2: function() {
            this._handleNavigationToStep(1);
        },
        editStep3: function() {
            this._handleNavigationToStep(2);
        },
        onSaveEmployee: function() {

        },
        onCancel: function() {
            sap.m.MessageBox.confirm(this.oView.getModel("i18n").getResourceBundle().getText("msgConfirmationHome"),{
			onClose : function(oAction){
		    	if(oAction === "OK"){
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter.navTo("Main",true);
		    	}
			}.bind(this)
		});
        },
        onSaveEmployee : function() {
            var body = {};
            var oModelView = this.getView().getModel();

            // Construccion del body
            body.FirstName      = oModelView.getProperty("/FirstName");
            body.LastName       = oModelView.getProperty("/LastName");
            body.Dni            = oModelView.getProperty("/Dni");
            body.CreationDate   = oModelView.getProperty("/CreationDate");
            body.Comments       = oModelView.getProperty("/Comments");
            body.Type           = oModelView.getProperty("/Type");
            body.SapId          = this.getOwnerComponent().SapId;
            body.UserToSalary   = [{
                Ammount : parseFloat(oModelView.getProperty("/salario")).toString(),
                Comments : oModelView.getProperty("/Comments"),
                Waers : "EUR"
            }];

            this.getView().setBusy(true);
            this.getView().getModel("odataModel").create("/Users",body,{
                success : function(data){
                    this.getView().setBusy(false);
                    this.newUserCreated = data.EmployeeId;
                    sap.m.MessageBox.information(this.oView.getModel("i18n").getResourceBundle().getText("empleadoNuevo") + ": " + this.newUserCreated,{
                        onClose : function(){
                            sap.ui.core.UIComponent.getRouterFor(this).navTo("Main",true);
                        }.bind(this)
                    });
                    this.onStartUpload();
                }.bind(this),
                error : function(e){
                    this.getView().setBusy(false);
                    sap.m.MessageBox.error(JSON.parse(e.responseText).error.message.value,{
                        title: this.oView.getModel("i18n").getResourceBundle().getText("errEmpleadoNuevo")
                    });
                }.bind(this)
            });
        }
    });
});