export const deleteResourceModal = (props) =>
  import('./DeleteResourceModal' /* webpackChunkName: "shared-modals" */).then((m) =>
    m.deleteResourceModal(props),
  );
