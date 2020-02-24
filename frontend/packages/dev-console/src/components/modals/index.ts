export const editApplicationModal = (props) =>
  import('./EditApplicationModal' /* webpackChunkName: "dev-console-modals" */).then((m) =>
    m.editApplicationModal(props),
  );

export const groupEditApplicationModal = (props) =>
  import('./EditApplicationModal' /* webpackChunkName: "dev-console-modals" */).then((m) =>
    m.groupEditApplicationModal(props),
  );

export const deleteApplicationModal = (props) =>
  import('./DeleteApplicationModal' /* webpackChunkName: "dev-console-modals" */).then((m) =>
    m.deleteApplicationModal(props),
  );
