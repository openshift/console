export const serviceBindingModal = (props) =>
  import(
    './ServiceBindingModalLauncher' /* webpackChunkName: "create-service-binding-modal" */
  ).then((m) => m.createServiceBindingModal(props));
