export const addApprovalModal = (props) =>
  import('./ApprovalController' /* webpackChunkName: "approval-connectors" */).then((m) =>
    m.ApprovalModalLauncher(props),
  );
