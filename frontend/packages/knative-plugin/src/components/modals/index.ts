export const setTrafficDistributionModal = (props) =>
  import(
    '../traffic-splitting/TrafficSplittingController' /* webpackChunkName: "set-traffic-splitting" */
  ).then((m) => m.trafficModalLauncher(props));
