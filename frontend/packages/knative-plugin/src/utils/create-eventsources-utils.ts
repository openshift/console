import { K8sResourceKind } from '@console/internal/module/k8s';
import { getAppLabels } from '@console/dev-console/src/utils/resource-label-utils';
import { annotations } from '@console/dev-console/src/utils/shared-submit-utils';
import { EventSources } from '../components/add/import-types';
import { ServiceModel } from '../models';
import { KNATIVE_EVENT_SOURCE_APIGROUP, KNATIVE_EVENT_SOURCE_APIGROUP_DEP } from '../const';

export const getEventSourcesDepResource = (formData: any): K8sResourceKind => {
  const {
    type,
    name,
    application: { name: applicationName },
    project: { name: namespace },
    data,
    sink: { knativeService },
  } = formData;

  const defaultLabel = getAppLabels(name, applicationName);
  const apiGroup =
    type === EventSources.ApiServerSource || type === EventSources.SinkBinding
      ? KNATIVE_EVENT_SOURCE_APIGROUP
      : KNATIVE_EVENT_SOURCE_APIGROUP_DEP;
  const apiVersion = 'v1alpha1';
  const eventSrcData = data[type.toLowerCase()];
  const eventSourceResource: K8sResourceKind = {
    kind: type,
    apiVersion: `${apiGroup}/${apiVersion}`,
    metadata: {
      name,
      namespace,
      labels: {
        ...defaultLabel,
      },
      annotations,
    },
    spec: {
      sink: {
        ref: {
          apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
          kind: ServiceModel.kind,
          name: knativeService,
        },
      },
      ...(eventSrcData && eventSrcData),
    },
  };

  return eventSourceResource;
};
