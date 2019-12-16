export const editApplicationModal = (props) =>
  import('./EditApplicationModal' /* webpackChunkName: "tags" */).then((m) =>
    m.editApplicationModal(props),
  );

export const deleteApplicationModal = (props) =>
  import('./DeleteApplicationModal' /* webpackChunkName: "delete-application-modal" */).then((m) =>
    m.deleteApplicationModal(props),
  );

export const editApplication = (props) =>
  import(
    '../edit-application/EditApplicationWrapper' /* webpackChunkName: "edit-application-modal" */
  ).then((m) => m.editApplication(props));
