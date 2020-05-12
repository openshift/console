import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { TRIGGERS_ANNOTATION } from '@console/shared';

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
    ...(imageStreamName && {
      'app.kubernetes.io/name': imageStreamName,
      'app.openshift.io/runtime': imageStreamName,
    }),
  };

  if (application && application.trim().length > 0) {
    labels['app.kubernetes.io/part-of'] = application;
  }
  if (selectedTag) {
    labels['app.openshift.io/runtime-version'] = selectedTag;
  }
  if (namespace) {
    labels['app.openshift.io/runtime-namespace'] = namespace;
  }

  return labels;
};

export const getGitAnnotations = (gitURL: string, gitRef?: string) => {
  const ref = gitRef || 'master';
  return {
    'app.openshift.io/vcs-uri': gitURL,
    'app.openshift.io/vcs-ref': ref,
  };
};

export const getCommonAnnotations = () => {
  return {
    'openshift.io/generated-by': 'OpenShiftWebConsole',
  };
};

export const getTriggerAnnotation = (name: string, namespace: string, tag: string = 'latest') => ({
  [TRIGGERS_ANNOTATION]: JSON.stringify([
    {
      from: { kind: 'ImageStreamTag', name: `${name}:${tag}`, namespace },
      fieldPath: `spec.template.spec.containers[?(@.name=="${name}")].image`,
    },
  ]),
});

export const getPodLabels = (name: string) => {
  return {
    app: name,
    deploymentconfig: name,
  };
};

export const mergeData = (originalResource: K8sResourceKind, newResource: K8sResourceKind) => {
  const mergedData = _.merge({}, originalResource || {}, newResource);
  mergedData.metadata.labels = newResource.metadata.labels;
  if (mergedData.metadata.annotations) {
    mergedData.metadata.annotations = newResource.metadata.annotations;
  }
  if (mergedData.spec?.template?.metadata?.labels) {
    mergedData.spec.template.metadata.labels = newResource.spec?.template?.metadata?.labels;
  }
  if (mergedData.spec?.template?.spec?.containers) {
    mergedData.spec.template.spec.containers = newResource.spec.template.spec.containers;
  }
  if (mergedData?.spec?.strategy) {
    mergedData.spec.strategy = newResource.spec.strategy;
  }
  if (mergedData.spec?.triggers) {
    mergedData.spec.triggers = newResource.spec.triggers;
  }
  return mergedData;
};
