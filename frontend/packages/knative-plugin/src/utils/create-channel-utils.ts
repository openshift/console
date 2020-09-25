import * as React from 'react';
import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';
import { checkAccess } from '@console/internal/components/utils';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { useChannelResourcesList } from './fetch-dynamic-eventsources-utils';
import {
  getGroupVersionKind,
  modelFor,
  isGroupVersionKind,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import {
  defaultChannels,
  ChannelListProps,
  AddChannelFormData,
} from '../components/add/import-types';
import { EventingChannelModel, EventingIMCModel, EventingKafkaChannelModel } from '../models';
import {
  getCommonAnnotations,
  getAppLabels,
} from '@console/dev-console/src/utils/resource-label-utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ConfigMapModel } from '@console/internal/models';

export const isDefaultChannel = (channel: string): boolean =>
  Object.keys(defaultChannels).includes(channel);

export const getChannelKind = (ref: string): string => {
  if (!ref || (ref && ref.length === 0) || (ref && !isGroupVersionKind(ref))) {
    return '';
  }
  const [, , channelKind] = getGroupVersionKind(ref);
  return channelKind;
};

export const useChannelList = (namespace: string): ChannelListProps => {
  const [accessData, setAccessData] = useSafetyFirst({ loaded: false, channelList: [] });
  const { channels, loaded: channelsLoaded } = useChannelResourcesList();
  React.useEffect(() => {
    const accessList = [];
    if (channelsLoaded) {
      _.forIn(channels, (channelRef: string) => {
        if (isGroupVersionKind(channelRef)) {
          const [group] = getGroupVersionKind(channelRef) ?? [];
          const { plural } = modelFor(channelRef) || {};
          accessList.push(
            checkAccess({
              group,
              resource: plural,
              namespace,
              verb: 'create',
            }).then((result) => (result.status.allowed ? channelRef : '')),
          );
        }
      });
      Promise.all(accessList)
        .then((results) => {
          const channelList = results.reduce((acc, result) => {
            if (result.length > 0) {
              return [...acc, result];
            }
            return acc;
          }, []);

          setAccessData({ loaded: true, channelList });
        })
        .catch((err) =>
          // eslint-disable-next-line no-console
          console.warn('Error while checking create access for channels', err.message),
        );
    }
  }, [namespace, channels, channelsLoaded, setAccessData]);

  return accessData;
};

export const getCreateChannelData = (formData: AddChannelFormData): K8sResourceKind => {
  const {
    type,
    name,
    data,
    application: { name: applicationName },
    namespace,
  } = formData;
  if (!isGroupVersionKind(type)) {
    return {};
  }
  const defaultLabel = getAppLabels({ name, applicationName });
  const [channelGroup, channelVersion, channelKind] = getGroupVersionKind(type);
  const channelSpecData = data[channelKind.toLowerCase()];
  const eventSourceResource: K8sResourceKind = {
    apiVersion: `${channelGroup}/${channelVersion}`,
    kind: channelKind,
    metadata: {
      name,
      namespace,
      labels: {
        ...defaultLabel,
      },
      annotations: getCommonAnnotations(),
    },
    spec: {
      ...(channelSpecData && channelSpecData),
    },
  };

  return eventSourceResource;
};

export const getCreateChannelResource = (formData: AddChannelFormData) => {
  switch (getChannelKind(formData.type)) {
    case EventingChannelModel.kind:
    case EventingIMCModel.kind:
    case EventingKafkaChannelModel.kind:
      return getCreateChannelData(formData);
    default:
      return safeLoad(formData.yamlData);
  }
};

export const getChannelData = (kind: string) => {
  const channelData = {
    kafkachannel: {
      numPartitions: 1,
      replicationFactor: 1,
    },
  };
  return channelData[kind];
};

export const useDefaultChannelConfiguration = (namespace: string): [string, boolean] => {
  const CHANNEL_CONFIGMAP_NAME = 'default-ch-webhook';
  const CHANNEL_CONFIGMAP_NAMESPACE = 'knative-eventing';

  const [configMap, defaultConfiguredChannelLoaded] = useK8sGet<K8sResourceKind>(
    ConfigMapModel,
    CHANNEL_CONFIGMAP_NAME,
    CHANNEL_CONFIGMAP_NAMESPACE,
  );
  let defaultConfiguredChannel = EventingIMCModel.kind;
  if (configMap && defaultConfiguredChannelLoaded) {
    const cfg = safeLoad(configMap.data?.['default-ch-config']);

    defaultConfiguredChannel = _.hasIn(cfg?.namespaceDefaults, namespace)
      ? cfg?.namespaceDefaults[namespace].kind
      : cfg?.clusterDefault.kind;
  }
  return [defaultConfiguredChannel, defaultConfiguredChannelLoaded];
};
