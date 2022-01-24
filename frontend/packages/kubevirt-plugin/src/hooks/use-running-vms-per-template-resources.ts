import * as React from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { TemplateModel } from '@console/internal/models';
import { K8sResourceCommon, TemplateKind } from '@console/internal/module/k8s';
import { TEMPLATE_TYPE_BASE, TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM } from '../constants';
import { VirtualMachineModel } from '../models';
import { kubevirtReferenceForModel } from '../models/kubevirtReferenceForModel';
import { VMKind } from '../types';
import { useDebounceCallback } from './use-debounce';
import { useDeepCompareMemoize } from './use-deep-compare-memoize';

export const useRunningVMsPerTemplateResources = (): {
  loaded: boolean;
  loadError: string;
  vms: VMKind[];
  templates: TemplateKind[];
} => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const [vms, setVMs] = React.useState<VMKind[]>([]);
  const [templates, setTemplates] = React.useState<TemplateKind[]>([]);

  const watchedResources = {
    vms: {
      kind: kubevirtReferenceForModel(VirtualMachineModel),
      isList: true,
      namespaced: false,
    },
    vmTemplates: {
      kind: kubevirtReferenceForModel(TemplateModel),
      isList: true,
      selector: {
        matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
      },
    },
    vmCommonTemplates: {
      kind: kubevirtReferenceForModel(TemplateModel),
      isList: true,
      namespace: 'openshift',
      selector: {
        matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
      },
    },
  };

  const resources = useK8sWatchResources<{ [key: string]: K8sResourceCommon[] }>(watchedResources);

  const updateResults = React.useCallback((updatedResources) => {
    const errorKey = Object.keys(updatedResources).find((key) => updatedResources[key].loadError);
    if (errorKey) {
      setLoadError(updatedResources[errorKey].loadError);
      return;
    }
    if (
      Object.keys(updatedResources).length > 0 &&
      Object.keys(updatedResources).every((key) => updatedResources[key].loaded)
    ) {
      setLoaded(true);
      setLoadError(null);
      setVMs(updatedResources?.vms?.data);
      setTemplates([
        ...updatedResources?.vmTemplates?.data,
        ...updatedResources?.vmCommonTemplates?.data,
      ]);
    }
  }, []);

  const debouncedUpdateResources = useDebounceCallback(updateResults, 250);

  React.useEffect(() => {
    debouncedUpdateResources(resources);
  }, [debouncedUpdateResources, resources]);

  return useDeepCompareMemoize({ loaded, loadError, vms, templates });
};
