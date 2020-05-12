import * as _ from 'lodash';
import { coFetch } from '@console/internal/co-fetch';
import { K8sKind, kindToAbbr, referenceForModel } from '@console/internal/module/k8s';
import { chart_color_red_300 as knativeEventingColor } from '@patternfly/react-tokens';
import {
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceSinkBindingModel,
  EventSourceCamelModel,
  EventSourcePingModel,
  EventSourceKafkaModel,
  EventSourceCronJobModel,
} from '../models';

let eventSourceModels: K8sKind[] = [];

// To order sources with known followed by CamelSource and everything else
export const orderedEventSourceModelData = (allModels: K8sKind[]): K8sKind[] => {
  const sortModels = _.orderBy(allModels, ['kind'], ['asc']);
  const knownSourcesList = [
    EventSourceApiServerModel.kind,
    EventSourceContainerModel.kind,
    EventSourceCronJobModel.kind,
    EventSourceKafkaModel.kind,
    EventSourcePingModel.kind,
    EventSourceSinkBindingModel.kind,
  ];
  const knownSourcesCrd = _.filter(sortModels, (model) => knownSourcesList.includes(model.kind));
  const camelSourcesCrd = _.filter(
    sortModels,
    (model) => model?.kind === EventSourceCamelModel.kind,
  );
  const dynamicSourcesCrd = _.filter(
    sortModels,
    (model) => !knownSourcesList.includes(model.kind) && model.kind !== EventSourceCamelModel.kind,
  );
  return [...knownSourcesCrd, ...camelSourcesCrd, ...dynamicSourcesCrd];
};

export const fetchEventSourcesCrd = async () => {
  const url = 'api/console/knative-event-sources';
  try {
    const res = await coFetch(url);
    const resolvedRes = await res.json();
    const allModels = _.reduce(
      resolvedRes?.items,
      (accumulator, crd) => {
        const {
          spec: {
            group,
            versions,
            names: { kind, plural, singular },
          },
        } = crd;
        const { name: version } = versions?.find((ver) => ver.served && ver.storage);
        if (version) {
          accumulator.push({
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
          });
        }
        return accumulator;
      },
      [],
    );

    eventSourceModels = orderedEventSourceModelData(allModels);
  } catch (err) {
    // show warning if there is an error fetching the CRDs
    // eslint-disable-next-line no-console
    console.warn('Error fetching CRDs for dynamic event sources', err);
    eventSourceModels = [];
  }
};

export const getEventSourceModels = (): K8sKind[] => eventSourceModels;

export const getDynamicEventSourcesResourceList = (namespace: string) => {
  return eventSourceModels.map((model) => {
    return {
      isList: true,
      kind: referenceForModel(model),
      namespace,
      prop: referenceForModel(model),
      optional: true,
    };
  });
};

export const getDynamicEventSourceModel = (resourceRef: string): K8sKind => {
  return eventSourceModels.find((model: K8sKind) => referenceForModel(model) === resourceRef);
};

export const getDynamicEventSourcesModelRefs = (): string[] => {
  return eventSourceModels.map((model: K8sKind) => referenceForModel(model));
};

export const isDynamicEventResourceKind = (resourceRef: string): boolean => {
  const index = eventSourceModels.findIndex(
    (model: K8sKind) => referenceForModel(model) === resourceRef,
  );
  return index !== -1;
};

export const hideDynamicEventSourceCard = () => eventSourceModels && eventSourceModels.length > 0;
