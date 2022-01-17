import * as React from 'react';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { useEventSourceModels, useChannelModels } from '../utils/fetch-dynamic-eventsources-utils';

type DynamicEsDataType = {
  eventSourceModels: K8sModel[];
  loaded: boolean;
};

type DynamicChannelDataType = {
  eventSourceChannels: K8sModel[];
  loaded: boolean;
};

export type EventingContextType = {
  eventSourceData: DynamicEsDataType;
  channelsData: DynamicChannelDataType;
};

export const EventingContext = React.createContext<EventingContextType>({
  eventSourceData: { eventSourceModels: [], loaded: false },
  channelsData: { eventSourceChannels: [], loaded: false },
});

export const EventingContextProvider = EventingContext.Provider;

export const useValuesEventingContext = (): EventingContextType => {
  const eventSourceData = useEventSourceModels();
  const channelsData = useChannelModels();

  return { eventSourceData, channelsData };
};
