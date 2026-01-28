import type { FC } from 'react';
import { useContext, useRef, useEffect, useMemo } from 'react';
import {
  WatchK8sResources,
  WatchK8sResourcesGeneric,
  TopologyDataModelFactory,
  ResolvedExtension,
} from '@console/dynamic-plugin-sdk';
import {
  referenceForModel,
  modelForGroupKind,
  referenceForExtensionModel,
} from '@console/internal/module/k8s';
import { useDeepCompareMemoize } from '@console/shared';
import { ModelContext, ExtensibleModel, ModelExtensionContext } from './ModelContext';

interface DataModelExtensionProps {
  dataModelFactory: ResolvedExtension<TopologyDataModelFactory>['properties'];
  uid: string;
}

const DataModelExtension: FC<DataModelExtensionProps> = ({ dataModelFactory, uid }) => {
  const dataModelContext = useContext<ExtensibleModel>(ModelContext);
  const {
    id,
    priority,
    resources: rawResources,
    getDataModel,
    isResourceDepicted,
    getDataModelReconciler,
  } = dataModelFactory;
  const workloadKeys = useDeepCompareMemoize(dataModelFactory.workloadKeys);

  // Convert WatchK8sResourcesGeneric to WatchK8sResources with namespace injection
  const finalResources = useMemo<WatchK8sResources<any> | undefined>(() => {
    if (!rawResources) {
      return undefined;
    }

    // Resources are already resolved by useResolvedExtensions, just need to convert format
    const genericResources = rawResources as WatchK8sResourcesGeneric;
    const converted: WatchK8sResources<any> = {};

    Object.entries(genericResources).forEach(([key, resource]) => {
      const { model, opts } = resource;

      if (!model) {
        // No model specified, just use opts with namespace
        converted[key] = { namespace: dataModelContext.namespace, ...opts };
        return;
      }

      // Convert model to kind reference
      let kindReference: string | undefined;

      if (model.version && model.group) {
        // Use referenceForExtensionModel for models with full GVK
        kindReference = referenceForExtensionModel({
          group: model.group,
          version: model.version,
          kind: model.kind,
        });
      } else {
        // Fall back to internal model reference resolution
        const internalModel = modelForGroupKind(model.group, model.kind);
        if (!internalModel) {
          // CRD not found - log warning and skip
          // eslint-disable-next-line no-console
          console.warn(
            `Extension "${uid}": Could not find model (CRD) for group "${model.group}" and kind "${model.kind}" to determine version. Please add a required flag to the extension to suppress this warning. The resource "${key}" will not be loaded and ignored in the topology view for now.`,
          );
          return;
        }
        kindReference = referenceForModel(internalModel);
      }

      converted[key] = {
        namespace: dataModelContext.namespace,
        kind: kindReference,
        ...opts,
      };
    });

    return converted;
  }, [rawResources, dataModelContext.namespace, uid]);

  const extensionContext = useRef<ModelExtensionContext>({
    priority,
    workloadKeys,
    resources: undefined,
  });

  useEffect(() => {
    const storedContext = dataModelContext.getExtension(id);
    if (!storedContext) {
      // All CodeRefs are already resolved by useResolvedExtensions
      const newContext: ModelExtensionContext = {
        priority,
        workloadKeys,
        resources: finalResources,
        // These are now direct functions, not CodeRefs that need resolution
        dataModelGetter: getDataModel || (() => Promise.resolve({})),
        dataModelDepicter: isResourceDepicted || (() => false),
        dataModelReconciler: getDataModelReconciler || (() => {}),
      };
      extensionContext.current = newContext;
      dataModelContext.updateExtension(id, newContext);
    }
  }, [
    dataModelContext,
    id,
    priority,
    finalResources,
    workloadKeys,
    getDataModel,
    isResourceDepicted,
    getDataModelReconciler,
  ]);

  return null;
};

export default DataModelExtension;
