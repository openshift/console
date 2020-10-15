import * as _ from 'lodash';
import { useEffect } from 'react';
import { coFetch } from '@console/internal/co-fetch';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import {
  K8sKind,
  kindToAbbr,
  referenceForModel,
  getLatestVersionForCRD,
} from '@console/internal/module/k8s';
import { chart_color_red_300 as knativeEventingColor } from '@patternfly/react-tokens/dist/js/chart_color_red_300';
import { EventingSubscriptionModel, EventingTriggerModel } from '../models';

interface EventSourcetData {
  loaded: boolean;
  eventSourceModels: K8sKind[];
  eventSourceChannels?: K8sKind[];
}

const eventSourceData: EventSourcetData = {
  loaded: false,
  eventSourceModels: [],
  eventSourceChannels: [],
};

interface EventChannelData {
  loaded: boolean;
  channels: string[];
}

export const fetchEventSourcesCrd = async () => {
  const url = 'api/console/knative-event-sources';
  try {
    const res = await coFetch(url);
    const resolvedRes = await res.json();
    const allModels = _.reduce(
      resolvedRes?.items,
      (accumulator, crd) => {
        const {
          metadata: { labels },
          spec: {
            group,
            names: { kind, plural, singular },
          },
        } = crd;
        const label = kind.replace(/([A-Z])/g, ' $1').trim();
        const crdLatestVersion = getLatestVersionForCRD(crd);
        if (crdLatestVersion) {
          const sourceModel = {
            apiGroup: group,
            apiVersion: crdLatestVersion,
            kind,
            plural,
            id: singular,
            label,
            labelPlural: `${label}s`,
            abbr: kindToAbbr(kind),
            namespaced: true,
            crd: true,
            color: knativeEventingColor.value,
          };
          const sourceIndex = _.findIndex(accumulator, ['kind', kind]);
          // added check as some sources has multiple entries with deprecated APIgroups
          if (sourceIndex === -1) {
            accumulator.push(sourceModel);
          } else if (!labels?.['eventing.knative.dev/deprecated'] === true) {
            accumulator.splice(sourceIndex, 1, sourceModel);
          }
        }
        return accumulator;
      },
      [],
    );

    eventSourceData.eventSourceModels = allModels;
  } catch (err) {
    // show warning if there is an error fetching the CRDs
    // eslint-disable-next-line no-console
    console.warn('Error fetching CRDs for dynamic event sources', err);
    eventSourceData.eventSourceModels = [];
  }
  eventSourceData.loaded = true;
  return eventSourceData.eventSourceModels;
};

export const useEventSourceModels = (): EventSourcetData => {
  const [modelsData, setModelsData] = useSafetyFirst({ loaded: false, eventSourceModels: [] });
  useEffect(() => {
    if (eventSourceData.eventSourceModels.length === 0) {
      fetchEventSourcesCrd()
        .then((data) => {
          setModelsData({ loaded: true, eventSourceModels: data });
        })
        .catch((err) => {
          setModelsData({ loaded: true, eventSourceModels: eventSourceData.eventSourceModels });
          // eslint-disable-next-line no-console
          console.warn('Error fetching CRDs for dynamic event sources', err);
        });
    } else {
      setModelsData({ loaded: true, eventSourceModels: eventSourceData.eventSourceModels });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return modelsData;
};

export const getEventSourceModels = (): K8sKind[] => eventSourceData.eventSourceModels;

export const getDynamicEventSourcesResourceList = (namespace: string, limit?: number) => {
  return eventSourceData.eventSourceModels.map((model) => {
    return {
      isList: true,
      kind: referenceForModel(model),
      namespace,
      prop: referenceForModel(model),
      optional: true,
      ...(limit && { limit }),
    };
  });
};

export const getDynamicEventSourcesWatchers = (namespace: string) => {
  return eventSourceData.eventSourceModels.reduce((acc, model) => {
    acc[referenceForModel(model)] = {
      isList: true,
      kind: referenceForModel(model),
      namespace,
      optional: true,
    };
    return acc;
  }, {});
};

export const getDynamicEventSourceModel = (resourceRef: string): K8sKind => {
  return eventSourceData.eventSourceModels.find(
    (model: K8sKind) => referenceForModel(model) === resourceRef,
  );
};

export const getDynamicEventSourcesModelRefs = (): string[] => {
  return eventSourceData.eventSourceModels.map((model: K8sKind) => referenceForModel(model));
};

export const isDynamicEventResourceKind = (resourceRef: string): boolean => {
  const index = eventSourceData.eventSourceModels.findIndex(
    (model: K8sKind) => referenceForModel(model) === resourceRef,
  );
  return index !== -1;
};

export const fetchChannelsCrd = async () => {
  const url = 'api/console/knative-channels';
  try {
    const res = await coFetch(url);
    const resolvedRes = await res.json();

    const allChannelModels = _.reduce(
      resolvedRes?.items,
      (accumulator, crd) => {
        const {
          spec: {
            group,
            names: { kind, plural, singular },
          },
        } = crd;
        const crdLatestVersion = getLatestVersionForCRD(crd);
        const label = kind.replace(/([A-Z])/g, ' $1').trim();
        const sourceModel = {
          apiGroup: group,
          apiVersion: crdLatestVersion,
          kind,
          plural,
          id: singular,
          label,
          labelPlural: `${label}s`,
          abbr: kindToAbbr(kind),
          namespaced: true,
          crd: true,
          color: knativeEventingColor.value,
        };
        accumulator.push(sourceModel);
        return accumulator;
      },
      [],
    );

    eventSourceData.eventSourceChannels = allChannelModels;
  } catch {
    eventSourceData.eventSourceChannels = [];
  }
  return eventSourceData.eventSourceChannels;
};

export const getDynamicChannelResourceList = (namespace: string, limit?: number) => {
  return eventSourceData.eventSourceChannels.map((model) => {
    return {
      isList: true,
      kind: referenceForModel(model),
      namespace,
      prop: referenceForModel(model),
      optional: true,
      ...(limit && { limit }),
    };
  });
};

export const getDynamicEventingChannelWatchers = (namespace: string) => {
  return eventSourceData.eventSourceChannels.reduce((acc, model) => {
    acc[referenceForModel(model)] = {
      isList: true,
      kind: referenceForModel(model),
      namespace,
      optional: true,
    };
    return acc;
  }, {});
};
export const useChannelResourcesList = (): EventChannelData => {
  const [modelRefs, setModelRefs] = useSafetyFirst<EventChannelData>({
    channels: [],
    loaded: false,
  });
  useEffect(() => {
    if (eventSourceData.eventSourceChannels.length === 0) {
      fetchChannelsCrd()
        .then((data) => {
          setModelRefs({
            channels: data.map((model: K8sKind) => referenceForModel(model)),
            loaded: true,
          });
        })
        .catch((err) => {
          setModelRefs({ channels: [], loaded: true });
          // eslint-disable-next-line no-console
          console.warn('Error fetching CRDs for dynamic channel model refs', err);
        });
    } else {
      setModelRefs({
        channels: eventSourceData.eventSourceChannels.map((model: K8sKind) =>
          referenceForModel(model),
        ),
        loaded: true,
      });
    }
  }, [setModelRefs]);
  return modelRefs;
};

export const getDynamicChannelModelRefs = (): string[] => {
  return eventSourceData.eventSourceChannels.map((model: K8sKind) => referenceForModel(model));
};

export const isEventingChannelResourceKind = (resourceRef: string): boolean => {
  const index = eventSourceData.eventSourceChannels.findIndex(
    (model: K8sKind) => referenceForModel(model) === resourceRef,
  );
  return index !== -1;
};

export const isEventingPubSubLinkKind = (kind: string) => {
  return [EventingSubscriptionModel.kind, EventingTriggerModel.kind].includes(kind);
};
