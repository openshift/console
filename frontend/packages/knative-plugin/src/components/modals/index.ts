export const setSinkSourceModal = (props) =>
  import('../sink-source/SinkSourceController' /* webpackChunkName: "sink-source" */).then((m) =>
    m.sinkModalLauncher(props),
  );
