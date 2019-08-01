export const getAppLabels = (
  name: string,
  application: string,
  imageStreamName?: string,
  selectedTag?: string,
) => {
  return {
    app: name,
    'app.kubernetes.io/part-of': application,
    'app.kubernetes.io/instance': name,
    'app.kubernetes.io/component': name,
    'app.kubernetes.io/name': imageStreamName,
    'app.openshift.io/runtime-version': selectedTag,
  };
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
