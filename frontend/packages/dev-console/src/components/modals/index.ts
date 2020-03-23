export const editApplicationModal = (props) =>
  import('./EditApplicationModal' /* webpackChunkName: "dev-console-modals" */).then((m) =>
    m.editApplicationModal(props),
  );

export const groupEditApplicationModal = (props) =>
  import('./EditApplicationModal' /* webpackChunkName: "dev-console-modals" */).then((m) =>
    m.groupEditApplicationModal(props),
  );

export const deleteResourceModal = (props) =>
  import('./DeleteResourceModal' /* webpackChunkName: "dev-console-modals" */).then((m) =>
    m.deleteResourceModal(props),
  );
