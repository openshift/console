export const setTrafficDistributionModal = (props) =>
  import(
    '../traffic-splitting/TrafficSplittingController' /* webpackChunkName: "set-traffic-splitting" */
  ).then((m) => m.trafficModalLauncher(props));

export const setSinkSourceModal = (props) =>
  import('../sink-source/SinkSourceController' /* webpackChunkName: "sink-source" */).then((m) =>
    m.sinkModalLauncher(props),
  );

export const deleteRevisionModal = (props) =>
  import(
    '../revisions/DeleteRevisionModalController' /* webpackChunkName: "delete-revision" */
  ).then((m) => m.deleteRevisionModalLauncher(props));
