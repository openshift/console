
// 0 images: []
// 1+ images: [{ImageVuln with no features}]
export const parsePodAnnotation = pod => {
  return _.attempt(JSON.parse.bind(null, _.get(pod, 'metadata.annotations.secscan/imageVulns')));
};

// Check if a pod was scanned
export const isScanned = podvuln => {
  return _.get(podvuln, 'metadata.annotations.secscan/lastScan');
};

// Get the number of images scanned
export const imagesScanned = podvuln => {
  return isScanned(podvuln) ? (_.has(podvuln, 'imagevulns') ? podvuln.imagevulns.length : 0) : 0;
};

// Check if the labeller has access to the images
// i.e. length ? 0
export const hasAccess = podvuln => {
  return imagesScanned(podvuln) > 0;
};

// Check is the pod's images are supported.
// Unsupported if:
//   - Cannot be scanned (does not have a feature field)
//   - Don't have access to the image. (e.g org permissions in Quay)
export const isSupported = podvuln => {
  return hasAccess(podvuln) ? _.every(
    _.map(podvuln.imagevulns, (imgvuln) => _.has(imgvuln, 'features')),
    Boolean) : false;
};

export const CountVulnerabilityFilter = (podvulns) => {
  if (!podvulns) {
    return undefined;
  }
  let count = {
    'P0': 0,
    'P1': 0,
    'P2': 0,
    'P3': 0,
    'Fixables': 0,
    'Passed': 0,
  };
  _.forEach(podvulns, (podvuln) => {
    if (_.has(podvuln, 'metadata.labels.secscan/P0')) {
      count.P0++;
    }
    if (_.has(podvuln, 'metadata.labels.secscan/P1')) {
      count.P1++;
    }
    if (_.has(podvuln, 'metadata.labels.secscan/P2')) {
      count.P2++;
    }
    if (_.has(podvuln, 'metadata.labels.secscan/P3')) {
      count.P3++;
    }
    if (_.has(podvuln, 'metadata.labels.secscan/fixables')) {
      count.Fixables++;
    }
    if (!_.has(podvuln, 'metadata.labels.secscan/P0') &&
        !_.has(podvuln, 'metadata.labels.secscan/P1') &&
        !_.has(podvuln, 'metadata.labels.secscan/P2') &&
        !_.has(podvuln, 'metadata.labels.secscan/P3')) {
      count.Passed++;
    }
  });
  return count;
};
