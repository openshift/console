import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessReview2 } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { EventSourceMetaData } from '../components/add/import-types';
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
  normalizedSource: EventSourceMetaData;
  kamelet: K8sResourceKind;
} => {
  const { t } = useTranslation();
  const { eventSourceModels, loaded: eventSourceModelsLoaded } = useEventSourceModels();
  const [kamelet, kameletLoaded] = useK8sGet<K8sResourceKind>(
    CamelKameletModel,
    kameletName,
    namespace,
  );

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
        normalizedSource: {} as EventSourceMetaData,
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
    eventSourceModelsLoaded,
    kameletLoaded,
    kamelet,
    isKameletSource,
    eventSourceModel,
    t,
  ]);

  return {
    ...sourceStatus,
    createSourceAccessLoading,
    createSourceAccess,
    kamelet,
  };
};
