export const editApplicationModal = (props) =>
  import('./EditApplicationModal' /* webpackChunkName: "tags" */).then((m) =>
    m.editApplicationModal(props),
  );

export const deleteApplicationModal = (props) =>
  import('./DeleteApplicationModal' /* webpackChunkName: "delete-application-modal" */).then((m) =>
    m.deleteApplicationModal(props),
  );
