import * as React from 'react';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { KnEventCatalogMetaData } from '../components/add/import-types';
import { GLOBAL_OPERATOR_NS } from '../const';
import { CamelKameletBindingModel, CamelKameletModel } from '../models';
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
  const kamelet = kameletLoaded && (kameletNs || kameletGlobalNs);

  const isKameletSink = kameletName && sinkKindProp === CamelKameletBindingModel.kind;

  const [createSinkAccess, createSinkAccessLoading] = useAccessReview({
    group: CamelKameletBindingModel?.apiGroup,
    resource: CamelKameletBindingModel?.plural,
    verb: 'create',
    namespace,
  });

  const sourceStatus = React.useMemo(() => {
    if (!isKameletSink) {
      return {
        isValidSink: false,
        loaded: true,
        normalizedSink: {} as KnEventCatalogMetaData,
      };
    }
    return {
      isValidSink: kameletLoaded && kamelet && isKameletSink,
      loaded: kameletLoaded,
      normalizedSink: getKameletMetadata(kamelet),
    };
  }, [kameletLoaded, kamelet, isKameletSink]);

  return {
    ...sourceStatus,
    createSinkAccessLoading,
    createSinkAccess,
    kamelet,
  };
};
