// This module utilizes dynamic `import()` to enable lazy-loading for each modal instead of including them in the main bundle.

export const startStopVMModal = (props) => import('./start-stop-vm-modal' /* webpackChunkName: "start-stop-vm-modal" */)
  .then(m => m.startStopVMModal(props));
