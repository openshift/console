// This logic (at this writing, Kubernetes 1.2.2) is replicated in kubeconfig
// (See https://github.com/kubernetes/kubernetes/blob/v1.3.0-alpha.2/pkg/kubectl/resource_printer.go#L574 )
export const podPhase = (pod) => {
  if (!pod || !pod.status) {
    return '';
  }

  if (pod.metadata.deletionTimestamp) {
    return 'Terminating';
  }

  let ret = pod.status.phase;
  if (pod.status.reason) {
    ret = pod.status.reason;
  }

  if (pod.status.containerStatuses) {
    pod.status.containerStatuses.forEach(function(container) {
      if (container.state.waiting && container.state.waiting.reason) {
        ret = container.state.waiting.reason;
      } else if (container.state.terminated && container.state.terminated.reason) {
        ret = container.state.terminated.reason;
      }
      // kubectl has code here that populates the field if
      // terminated && !reason, but at this writing there appears to
      // be no codepath that will produce that sort of output inside
      // of the kubelet.
    });
  }

  return ret;
};

export const podReadiness = ({status}) => {
  if (_.isEmpty(status.conditions)) {
    return null;
  }

  let allReady = true;
  const conditions = _.map(status.conditions, c => {
    if (c.status !== 'True') {
      allReady = false;
    }
    return Object.assign({time: new Date(c.lastTransitionTime)}, c);
  });

  if (allReady) {
    return 'Ready';
  }

  let earliestNotReady = null;
  _.each(conditions, c => {
    if (c.status === 'True') {
      return;
    }
    if (!earliestNotReady) {
      earliestNotReady = c;
      return;
    }
    if (c.time < earliestNotReady.time) {
      earliestNotReady = c;
    }
  });

  return earliestNotReady.reason || earliestNotReady.type;
};
