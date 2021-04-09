export const resourceLimitsModal = (props) =>
  import(
    './ResourceLimitsModalLauncher' /* webpackChunkName: "resource-limits-modal" */
  ).then((m) => m.resourceLimitsModal(props));
