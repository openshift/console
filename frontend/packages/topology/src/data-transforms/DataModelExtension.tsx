import { useContext, useRef, useEffect, useMemo } from 'react';
import {
  WatchK8sResources,
  WatchK8sResourcesGeneric,
  WatchK8sResource,
  TopologyDataModelFactory,
} from '@console/dynamic-plugin-sdk';
import { referenceForModel, modelForGroupKind } from '@console/internal/module/k8s';
import { useDeepCompareMemoize } from '@console/shared';
import { useResolvedResources } from '../hooks/useTopologyDataModelFactory';
import { ModelContext, ExtensibleModel, ModelExtensionContext } from './ModelContext';

interface DataModelExtensionProps {
  dataModelFactory: DynamicTopologyDataModelFactory['properties'];
}

/**
 * Converts a single resource from WatchK8sResourcesGeneric format to WatchK8sResource format.
 * This handles the namespace injection and model reference resolution.
 */
const convertGenericResource = (
  namespace: string,
  model?: { group?: string; version?: string; kind: string },
  opts?: Partial<WatchK8sResource>,
): WatchK8sResource | null => {
  if (!model) {
    return { namespace, ...opts };
  }

  // Try to find the internal model
  const internalModel = modelForGroupKind(model.group, model.kind);
  if (!internalModel) {
    // CRD not found - log warning and skip
    // eslint-disable-next-line no-console
    console.warn(
      `Could not find model (CRD) for group "${model.group}" and kind "${model.kind}". Resource will be skipped.`,
    );
    return null;
  }

  const reference = referenceForModel(internalModel);
  return { namespace, kind: reference, ...opts };
};

const DataModelExtension: React.FC<DataModelExtensionProps> = ({ dataModelFactory }) => {
  const dataModelContext = useContext<ExtensibleModel>(ModelContext);
  const { id, priority, resources: rawResources } = dataModelFactory;
  const workloadKeys = useDeepCompareMemoize(dataModelFactory.workloadKeys);
  const { resolved: resolvedResources, isGeneric } = useResolvedResources(rawResources);

  // Convert WatchK8sResourcesGeneric to WatchK8sResources
  const finalResources = useMemo<WatchK8sResources<any> | undefined>(() => {
    if (!resolvedResources) {
      return undefined;
    }

    if (isGeneric) {
      // Resources are in WatchK8sResourcesGeneric format, need to be converted
      const genericResources = resolvedResources as WatchK8sResourcesGeneric;
      const converted: WatchK8sResources<any> = {};

      Object.entries(genericResources).forEach(([key, resource]) => {
        const flattenedResource = convertGenericResource(
          dataModelContext.namespace,
          resource?.model,
          resource?.opts,
        );
        if (flattenedResource) {
          converted[key] = flattenedResource;
        }
      });

      return converted;
    }

    // Should not reach here as isGeneric is always true now
    return resolvedResources as WatchK8sResources<any>;
  }, [resolvedResources, isGeneric, dataModelContext.namespace]);

  const extensionContext = useRef<ModelExtensionContext>({
    priority,
    workloadKeys,
    resources: undefined,
  });

  useEffect(() => {
    const storedContext = dataModelContext.getExtension(id);
    if (!storedContext) {
      extensionContext.current = {
        priority,
        workloadKeys,
        resources: finalResources,
      };
      dataModelContext.updateExtension(id, extensionContext.current);

      const { getDataModel, isResourceDepicted, getDataModelReconciler } = dataModelFactory;
      if (getDataModel) {
        getDataModel()
          .then((getter) => {
            extensionContext.current.dataModelGetter = getter;
            dataModelContext.updateExtension(id, extensionContext.current);
          })
          .catch(() => {
            extensionContext.current.dataModelGetter = () => Promise.resolve({});
            dataModelContext.updateExtension(id, extensionContext.current);
          });
      } else {
        extensionContext.current.dataModelGetter = () => Promise.resolve({});
        dataModelContext.updateExtension(id, extensionContext.current);
      }

      if (isResourceDepicted) {
        isResourceDepicted()
          .then((depicter) => {
            extensionContext.current.dataModelDepicter = depicter;
            dataModelContext.updateExtension(id, extensionContext.current);
          })
          .catch(() => {
            extensionContext.current.dataModelDepicter = () => false;
            dataModelContext.updateExtension(id, extensionContext.current);
          });
      } else {
        extensionContext.current.dataModelDepicter = () => false;
        dataModelContext.updateExtension(id, extensionContext.current);
      }

      if (getDataModelReconciler) {
        getDataModelReconciler()
          .then((reconciler) => {
            extensionContext.current.dataModelReconciler = reconciler;
            dataModelContext.updateExtension(id, extensionContext.current);
          })
          .catch(() => {
            extensionContext.current.dataModelReconciler = () => {};
            dataModelContext.updateExtension(id, extensionContext.current);
          });
      } else {
        extensionContext.current.dataModelReconciler = () => {};
        dataModelContext.updateExtension(id, extensionContext.current);
      }
    }
  }, [dataModelContext, dataModelFactory, id, priority, finalResources, workloadKeys]);

  return null;
};

export default DataModelExtension;
