import * as _ from 'lodash';
import { coFetch } from '@console/internal/co-fetch';
import { K8sKind } from '@console/internal/module/k8s';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import { chart_color_red_300 as knativeEventingColor } from '@patternfly/react-tokens';
import {
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceSinkBindingModel,
  EventSourceKafkaModel,
  EventSourceCamelModel,
} from '../models';

interface EventSourceData {
  models: K8sKind[];
}

export const eventSourceData: EventSourceData = {
  models: [],
};

export const getSourcesModel = async () => {
  let eventSourceModelList: K8sKind[];
  const url = `api/kubernetes/apis/${CustomResourceDefinitionModel.apiGroup}/${
    CustomResourceDefinitionModel.apiVersion
  }/${CustomResourceDefinitionModel.plural}?limit=250&labelSelector=${encodeURIComponent(
    'duck.knative.dev/source=true',
  )}`;
  try {
    const res = await coFetch(url);
    const resolvedRes = await res.json();
    eventSourceModelList = _.map(resolvedRes?.items, (crd) => {
      const {
        spec: { group, version, names },
      } = crd;
      return {
        apiGroup: group,
        apiVersion: version,
        kind: names?.kind,
        plural: names?.plural,
        id: names?.singular,
        label: names?.singular,
        labelPlural: names?.plural,
        abbr: names?.kind?.replace(/[a-z]/g, ''),
        namespaced: true,
        crd: true,
        color: knativeEventingColor.value,
      };
    });
    eventSourceData.models = [...eventSourceModelList, ...eventSourceData.models];
  } catch {
    eventSourceModelList = [
      EventSourceCronJobModel,
      EventSourceContainerModel,
      EventSourceApiServerModel,
      EventSourceSinkBindingModel,
      EventSourceKafkaModel,
      EventSourceCamelModel,
    ];
    eventSourceData.models = [...eventSourceModelList, ...eventSourceData.models];
  }
};
