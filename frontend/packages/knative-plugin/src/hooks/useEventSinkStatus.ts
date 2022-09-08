import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessReview } from '@console/dynamic-plugin-sdk';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { KnEventCatalogMetaData } from '../components/add/import-types';
import { GLOBAL_OPERATOR_NS } from '../const';
import { CamelKameletBindingModel, CamelKameletModel, KafkaSinkModel } from '../models';
import { getEventSinkMetadata } from '../utils/create-eventsink-utils';
import { getKameletMetadata } from '../utils/create-eventsources-utils';

export const useEventSinkStatus = (
  namespace: string,
  sinkKindProp?: string,
  kameletName?: string,
): {
  isValidSink: boolean;
  createSinkAccessLoading: boolean;
  createSinkAccess: boolean;
  loaded: boolean;
  normalizedSink: KnEventCatalogMetaData;
  kamelet: K8sResourceKind;
} => {
  const { t } = useTranslation();
  const [kameletNs, kameletNsLoaded] = useK8sGet<K8sResourceKind>(
    CamelKameletModel,
    kameletName,
    namespace,
  );
  const [kameletGlobalNs, kameletGlobalNsLoaded] = useK8sGet<K8sResourceKind>(
    CamelKameletModel,
    kameletName,
    GLOBAL_OPERATOR_NS,
  );

  const kameletLoaded = kameletNsLoaded && kameletGlobalNsLoaded;
  const kamelet = kameletName && kameletLoaded && (kameletNs || kameletGlobalNs);

  const isKameletSink = kameletName && sinkKindProp === CamelKameletBindingModel.kind;
  const isSinkKindPresent = sinkKindProp || isKameletSink;

  const eventSinkModel =
    sinkKindProp && !isKameletSink && KafkaSinkModel.kind === sinkKindProp && KafkaSinkModel;
  const sinkModel = isKameletSink ? CamelKameletBindingModel : eventSinkModel;

  const [createSinkAccess, createSinkAccessLoading] = useAccessReview({
    group: sinkModel?.apiGroup,
    resource: sinkModel?.plural,
    verb: 'create',
    namespace,
  });

  const sourceStatus = React.useMemo(() => {
    if (!isSinkKindPresent) {
      return {
        isValidSink: false,
        loaded: true,
        normalizedSink: {} as KnEventCatalogMetaData,
      };
    }
    return {
      isValidSink: !!eventSinkModel || (kameletLoaded && kamelet && isKameletSink),
      loaded: isKameletSink ? kameletLoaded : !!eventSinkModel,
      normalizedSink: isKameletSink
        ? getKameletMetadata(kamelet)
        : getEventSinkMetadata(eventSinkModel, t),
    };
  }, [isSinkKindPresent, eventSinkModel, kameletLoaded, kamelet, isKameletSink, t]);

  return {
    ...sourceStatus,
    createSinkAccessLoading,
    createSinkAccess,
    kamelet,
  };
};
