import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessReview } from '@console/dynamic-plugin-sdk';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { K8sModel, K8sResourceKind } from '@console/internal/module/k8s';
import { KnEventCatalogMetaData } from '../components/add/import-types';
import { CAMEL_K_OPERATOR_NS, GLOBAL_OPERATOR_NS } from '../const';
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
  kamelet: K8sResourceKind | undefined;
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
  const [kameletGlobalNs2, kameletGlobalNs2Loaded] = useK8sGet<K8sResourceKind>(
    CamelKameletModel,
    kameletName,
    CAMEL_K_OPERATOR_NS,
  );

  const kameletLoaded = kameletNsLoaded && kameletGlobalNsLoaded && kameletGlobalNs2Loaded;
  const kamelet =
    kameletName && kameletLoaded && (kameletNs || kameletGlobalNs || kameletGlobalNs2);

  const isKameletSink = kameletName && sinkKindProp === CamelKameletBindingModel.kind;
  const isSinkKindPresent = sinkKindProp || isKameletSink;

  const eventSinkModel =
    sinkKindProp && !isKameletSink && KafkaSinkModel.kind === sinkKindProp && KafkaSinkModel;
  const sinkModel = isKameletSink ? CamelKameletBindingModel : eventSinkModel;

  const [createSinkAccess, createSinkAccessLoading] = useAccessReview({
    group: (sinkModel as K8sModel)?.apiGroup,
    resource: (sinkModel as K8sModel)?.plural,
    verb: 'create',
    namespace,
  });

  const sourceStatus = useMemo(() => {
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
        ? getKameletMetadata(kamelet as K8sResourceKind)
        : getEventSinkMetadata(eventSinkModel as K8sModel, t),
    };
  }, [isSinkKindPresent, eventSinkModel, kameletLoaded, kamelet, isKameletSink, t]);

  return {
    ...sourceStatus,
    isValidSink: Boolean(sourceStatus.isValidSink),
    createSinkAccessLoading,
    createSinkAccess,
    kamelet: kamelet as K8sResourceKind,
  };
};
