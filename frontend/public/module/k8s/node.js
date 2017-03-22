const hasAnnotation_ = (node, key) => (
  node &&
  node.metadata &&
  node.metadata.annotations &&
  Object.hasOwnProperty.call(node.metadata.annotations, key)
);

export const isNodeReady = (node) => {
  if (!node || !node.status || !node.status.conditions || !node.status.conditions.length) {
    return false;
  }

  const readyState = _.find(node.status.conditions, { type: 'Ready' });
  if (!readyState) {
    return false;
  }

  return readyState.status === 'True';
};

export const isTrusted = (node) => {
  const UNTRUSTED_ANNOTATION_KEY = 'scheduler.alpha.kubernetes.io/taints';

  if (!hasAnnotation_(node, UNTRUSTED_ANNOTATION_KEY)) {
    return true;
  }

  let taints = node.metadata.annotations[UNTRUSTED_ANNOTATION_KEY];

  try {
    taints = JSON.parse(taints);
  } catch (error) {
    // ????
    return false;
  }

  // Matthew Garrett:
  //   The value is metadata
  //   It's irrelevant
  //   It's the existence of the taint entry that controls it
  const tainted = taints.reduce((isTainted, taint) => {
    if (taint.key.toLocaleLowerCase() === 'untrusted') {
      return true;
    }
    return isTainted;
  }, false);

  return !tainted;
};
