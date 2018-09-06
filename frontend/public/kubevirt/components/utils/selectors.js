export const isKubevirt = () => {
  /*
  Without hacking, proper implementation will probably require additional changes in core OKD sources (use of connect(), avoid import of store here).

  The fact that we are here means, the OKD Virtualization application has been deployed.
  This is expected to happen along kubevirt/CNV deployment, so following hack might be good-enough solution.

  Anyway if needed properly, connect to redux: store.state[featureReducerName][FLAGS.KUBEVIRT]
   */
  return true;
};
