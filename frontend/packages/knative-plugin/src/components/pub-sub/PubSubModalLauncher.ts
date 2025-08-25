export const addPubSubConnectionModal = (props) =>
  import('./PubSubController' /* webpackChunkName: "pub-sub-connectors" */).then((m) =>
    m.PubSubModalLauncher(props),
  );
