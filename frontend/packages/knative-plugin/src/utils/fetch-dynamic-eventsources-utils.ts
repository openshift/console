import * as _ from 'lodash';
import { coFetch } from '@console/internal/co-fetch';
import { K8sKind, kindToAbbr } from '@console/internal/module/k8s';
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

const defaultEventSourceModelsData = [
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceContainerModel,
  EventSourceCronJobModel,
  EventSourceKafkaModel,
  EventSourceSinkBindingModel,
];

let eventSourceData: K8sKind[] = defaultEventSourceModelsData;

// To order sources with known followed by CamelSource and everything else
export const orderedEventSourceModelData = (allModels: K8sKind[]): K8sKind[] => {
  const sortModels = _.orderBy(allModels, ['kind'], ['asc']);
  const knownSourcesCrd = _.filter(
    sortModels,
    (model) =>
      !!_.find(defaultEventSourceModelsData, { kind: model?.kind }) &&
      model?.kind !== EventSourceCamelModel.kind,
  );
  const camelSourcesCrd = _.filter(
    sortModels,
    (model) => model?.kind === EventSourceCamelModel.kind,
  );
  const dynamicSourcesCrd = _.filter(
    sortModels,
    (model) =>
      !_.find(defaultEventSourceModelsData, { kind: model?.kind }) &&
      model?.kind !== EventSourceCamelModel.kind,
  );
  return [...knownSourcesCrd, ...camelSourcesCrd, ...dynamicSourcesCrd];
};

export const fetchEventSourcesCrd = async () => {
  let eventSourceModelList: K8sKind[] = [];
  const url = `api/kubernetes/apis/${CustomResourceDefinitionModel.apiGroup}/${
    CustomResourceDefinitionModel.apiVersion
  }/${CustomResourceDefinitionModel.plural}?limit=250&labelSelector=${encodeURIComponent(
    'duck.knative.dev/source=true',
  )}`;
  try {
    const res = await coFetch(url);
    const resolvedRes = await res.json();
    const allModels = _.map(resolvedRes?.items, (crd) => {
      const {
        spec: {
          group,
          version,
          names: { kind, plural, singular },
        },
      } = crd;
      return {
        apiGroup: group,
        apiVersion: version,
        kind,
        plural,
        id: singular,
        label: singular,
        labelPlural: plural,
        abbr: kindToAbbr(kind),
        namespaced: true,
        crd: true,
        color: knativeEventingColor.value,
      };
    });
    eventSourceModelList = orderedEventSourceModelData(allModels);
  } catch (err) {
    // show warning if there is an error fetching the CRDs
    // eslint-disable-next-line no-console
    console.warn('Error fetching CRDs for dynamic event sources', err);
    eventSourceModelList = defaultEventSourceModelsData;
  }
  eventSourceData = eventSourceModelList;
};

export const getEventSourceModelsData = (): K8sKind[] => eventSourceData;
