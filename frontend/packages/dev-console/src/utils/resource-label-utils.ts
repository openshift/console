export const getAppLabels = (
  name: string,
  application?: string,
  imageStreamName?: string,
  selectedTag?: string,
  namespace?: string,
) => {
  const labels = {
    app: name,
    'app.kubernetes.io/instance': name,
    'app.kubernetes.io/component': name,
    'app.kubernetes.io/name': imageStreamName,
    'app.openshift.io/runtime': imageStreamName,
  };

  if (application && application.trim().length > 0) {
    labels['app.kubernetes.io/part-of'] = application;
  }
  if (selectedTag) {
    labels['app.openshift.io/runtime-version'] = selectedTag;
  }
  if (namespace) {
    labels['app/runtime-namespace'] = namespace;
  }

  return labels;
};

export const getAppAnnotations = (gitURL: string, gitRef: string) => {
  const ref = gitRef || 'master';
  return {
    'app.openshift.io/vcs-uri': gitURL,
    'app.openshift.io/vcs-ref': ref,
  };
};

export const getPodLabels = (name: string) => {
  return {
    app: name,
    deploymentconfig: name,
  };
};
