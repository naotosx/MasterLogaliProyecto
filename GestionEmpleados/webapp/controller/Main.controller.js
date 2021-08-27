sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    return Controller.extend("MasterLogali.GestionEmpleados.controller.Main", {
        onInit : function() {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        },

        onCrearEmpleadoTile: function() {
            this.oRouter.navTo("crearEmpleado");
        },

        onVerEmpleadoTile: function() {
            this.oRouter.navTo("verEmpleado");
        },

        onFirmarPedidoTile: function() {
            var genericTileFirmarPedido = this.byId("linkFirmarPedido");
            //Id del dom
            var idGenericTileFirmarPedido = genericTileFirmarPedido.getId();
            //Se vacia el id
            jQuery("#"+idGenericTileFirmarPedido)[0].id = "";
        }
    });
});