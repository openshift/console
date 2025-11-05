import { useContext, useRef, useEffect, useMemo } from 'react';
import {
  WatchK8sResources,
  WatchK8sResourcesGeneric,
  WatchK8sResource,
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
  pluginID: string;
}

/**
 * Converts a single resource from WatchK8sResourcesGeneric format to WatchK8sResource format.
 * This handles the namespace injection and model reference resolution.
 */
const convertGenericResource = (
  namespace: string,
  pluginID: string,
  resourceKey: string,
  model?: { group?: string; version?: string; kind: string },
  opts?: Partial<WatchK8sResource>,
): WatchK8sResource | null => {
  if (!model) {
    return { namespace, ...opts };
  }

  // If version is provided, use referenceForExtensionModel directly
  if (model.version && model.group) {
    const extensionReference = referenceForExtensionModel({
      group: model.group,
      version: model.version,
      kind: model.kind,
    });
    return { namespace, kind: extensionReference, ...opts };
  }

  // Fall back to internal model reference resolution
  const internalModel = modelForGroupKind(model.group, model.kind);
  if (!internalModel) {
    // CRD not found - log warning and skip
    // eslint-disable-next-line no-console
    console.warn(
      `Plugin "${pluginID}": Could not find model (CRD) for group "${model.group}" and kind "${model.kind}" to determine version. Please add a required flag to the extension to suppress this warning. The resource "${resourceKey}" will not be loaded and ignored in the topology view for now.`,
    );
    return null;
  }

  const internalReference = referenceForModel(internalModel);
  return { namespace, kind: internalReference, ...opts };
};

const DataModelExtension: React.FC<DataModelExtensionProps> = ({ dataModelFactory, pluginID }) => {
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
      const flattenedResource = convertGenericResource(
        dataModelContext.namespace,
        pluginID,
        key,
        resource?.model,
        resource?.opts,
      );
      if (flattenedResource) {
        converted[key] = flattenedResource;
      }
    });

    return converted;
  }, [rawResources, dataModelContext.namespace, pluginID]);

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
