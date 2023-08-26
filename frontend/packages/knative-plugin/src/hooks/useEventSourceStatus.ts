import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessReview2 } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { KnEventCatalogMetaData } from '../components/add/import-types';
import { CAMEL_K_OPERATOR_NS, GLOBAL_OPERATOR_NS } from '../const';
import { CamelKameletBindingModel, CamelKameletModel } from '../models';
import { getEventSourceMetadata, getKameletMetadata } from '../utils/create-eventsources-utils';
import { useEventSourceModels } from '../utils/fetch-dynamic-eventsources-utils';

export const useEventSourceStatus = (
  namespace: string,
  sourceKindProp?: string,
  kameletName?: string,
): {
  isValidSource: boolean;
  createSourceAccessLoading: boolean;
  createSourceAccess: boolean;
  loaded: boolean;
  normalizedSource: KnEventCatalogMetaData;
  kamelet: K8sResourceKind;
} => {
  const { t } = useTranslation();
  const { eventSourceModels, loaded: eventSourceModelsLoaded } = useEventSourceModels();
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
  const kamelet = kameletLoaded && (kameletNs || kameletGlobalNs || kameletGlobalNs2);

  const isKameletSource = kameletName && sourceKindProp === CamelKameletBindingModel.kind;
  const isSourceKindPresent = sourceKindProp || isKameletSource;

  const eventSourceModel =
    sourceKindProp &&
    !isKameletSource &&
    eventSourceModels?.find((model: K8sKind) => model.kind === sourceKindProp);
  const sourceModel = isKameletSource ? CamelKameletBindingModel : eventSourceModel;

  const [createSourceAccess, createSourceAccessLoading] = useAccessReview2({
    group: sourceModel?.apiGroup,
    resource: sourceModel?.plural,
    verb: 'create',
    namespace,
  });

  const sourceStatus = React.useMemo(() => {
    if (!isSourceKindPresent) {
      return {
        isValidSource: false,
        loaded: true,
        normalizedSource: {} as KnEventCatalogMetaData,
      };
    }
    return {
      isValidSource: !!eventSourceModel || (kameletLoaded && kamelet && isKameletSource),
      loaded: isKameletSource ? kameletLoaded : eventSourceModelsLoaded,
      normalizedSource: isKameletSource
        ? getKameletMetadata(kamelet)
        : getEventSourceMetadata(eventSourceModel, t),
    };
  }, [
    isSourceKindPresent,
    eventSourceModel,
    kameletLoaded,
    kamelet,
    isKameletSource,
    eventSourceModelsLoaded,
    t,
  ]);

  return {
    ...sourceStatus,
    createSourceAccessLoading,
    createSourceAccess,
    kamelet,
  };
};
