import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { TRIGGERS_ANNOTATION } from '@console/shared';

export const getAppLabels = ({
  name,
  applicationName,
  imageStreamName,
  runtimeIcon,
  selectedTag,
  namespace,
}: {
  name: string;
  applicationName?: string;
  imageStreamName?: string;
  runtimeIcon?: string;
  selectedTag?: string;
  namespace?: string;
}) => {
  const labels = {
    app: name,
    'app.kubernetes.io/instance': name,
    'app.kubernetes.io/component': name,
    'app.kubernetes.io/name': name,
    ...(imageStreamName && {
      'app.openshift.io/runtime': imageStreamName,
    }),
  };

  if (runtimeIcon) {
    labels['app.openshift.io/runtime'] = runtimeIcon;
  }
  if (applicationName && applicationName.trim().length > 0) {
    labels['app.kubernetes.io/part-of'] = applicationName;
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
  return {
    'app.openshift.io/vcs-uri': gitURL,
    'app.openshift.io/vcs-ref': gitRef || '',
  };
};

export const getCommonAnnotations = () => {
  return {
    'openshift.io/generated-by': 'OpenShiftWebConsole',
  };
};

export const getTriggerAnnotation = (
  containerName: string,
  imageName: string,
  imageNamespace: string,
  imageTrigger: boolean,
  imageTag: string = 'latest',
) => ({
  [TRIGGERS_ANNOTATION]: JSON.stringify([
    {
      from: { kind: 'ImageStreamTag', name: `${imageName}:${imageTag}`, namespace: imageNamespace },
      fieldPath: `spec.template.spec.containers[?(@.name=="${containerName}")].image`,
      pause: `${!imageTrigger}`,
    },
  ]),
});

export const getUserAnnotations = (allAnnotations: { [key: string]: string }) => {
  const defaultAnnotations = [
    'app.openshift.io/vcs-uri',
    'app.openshift.io/vcs-ref',
    'openshift.io/generated-by',
    'image.openshift.io/triggers',
    'alpha.image.policy.openshift.io/resolve-names',
  ];
  return _.omit(allAnnotations, defaultAnnotations);
};

export const getPodLabels = (name: string) => {
  return {
    app: name,
    deploymentconfig: name,
  };
};

export const mergeData = (originalResource: K8sResourceKind, newResource: K8sResourceKind) => {
  if (_.isEmpty(originalResource)) return newResource;

  const mergedData = _.merge({}, originalResource || {}, newResource);
  const isDevfileResource = originalResource?.metadata?.annotations?.isFromDevfile;
  mergedData.metadata.labels = {
    ...newResource.metadata.labels,
    ...(isDevfileResource ? originalResource?.metadata?.labels : {}),
  };
  if (mergedData.metadata.annotations) {
    mergedData.metadata.annotations = {
      ...(isDevfileResource
        ? originalResource?.metadata?.annotations
        : getUserAnnotations(originalResource?.metadata?.annotations)),
      ...newResource.metadata.annotations,
    };
  }
  if (mergedData.spec?.template?.metadata?.labels) {
    mergedData.spec.template.metadata.labels = newResource.spec?.template?.metadata?.labels;
  }
  if (!_.isEmpty(originalResource.spec?.template?.spec?.containers)) {
    mergedData.spec.template.spec.containers = originalResource.spec.template.spec.containers;
    const index = _.findIndex(originalResource.spec.template.spec.containers, {
      name: originalResource.metadata.name,
    });
    if (index >= 0) {
      mergedData.spec.template.spec.containers[index] = {
        ...originalResource.spec.template.spec.containers[index],
        ...newResource.spec.template.spec.containers[0],
        // Keep the volumeMounts as is since we do not give an option to edit these currently
        volumeMounts: originalResource.spec.template.spec.containers[index].volumeMounts,
      };
    } else {
      mergedData.spec.template.spec.containers.push(newResource.spec.template.spec.containers[0]);
    }
  }
  if (mergedData?.spec?.hasOwnProperty('strategy')) {
    mergedData.spec.strategy = newResource.spec?.strategy ?? originalResource.spec?.strategy;
  }
  if (mergedData.spec?.triggers) {
    mergedData.spec.triggers = newResource.spec.triggers;
  }
  if (mergedData.spec?.template?.spec?.hasOwnProperty('volumes')) {
    mergedData.spec.template.spec.volumes = originalResource.spec?.template?.spec?.volumes;
  }
  return mergedData;
};

export const getTemplateLabels = (deployment: K8sResourceKind) => {
  return _.reduce(
    deployment?.spec?.template?.metadata?.labels,
    (acc, value, key) => {
      if (!deployment.metadata?.labels?.hasOwnProperty(key)) {
        acc[key] = value;
      }
      return acc;
    },
    {},
  );
};
