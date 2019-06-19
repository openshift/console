export const getAppLabels = (name: string, application: string, imageStreamName?: string) => {
  return {
    app: name,
    'app.kubernetes.io/part-of': application,
    'app.kubernetes.io/instance': name,
    'app.kubernetes.io/component': name,
    'app.kubernetes.io/name': imageStreamName,
  };
};

export const getPodLabels = (name: string) => {
  return {
    app: name,
    deploymentconfig: name,
  };
};
