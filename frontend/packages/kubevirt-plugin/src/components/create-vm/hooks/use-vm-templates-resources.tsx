import * as React from 'react';
import { isUpstream } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel, PodModel, TemplateModel } from '@console/internal/models';
import { PersistentVolumeClaimKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import {
  CDI_APP_LABEL,
  KUBEVIRT_OS_IMAGES_NS,
  OPENSHIFT_OS_IMAGES_NS,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
} from '../../../constants';
import { useBaseImages } from '../../../hooks/use-base-images';
import { DataSourceModel, DataVolumeModel } from '../../../models';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';
import { DataSourceKind } from '../../../types';
import { V1alpha1DataVolume } from '../../../types/api';

export const useVmTemplatesResources = (namespace: string): useVmTemplatesResourcesValues => {
  const [userTemplates, utLoaded, utError] = useK8sWatchResource<TemplateKind[]>({
    kind: TemplateModel.kind,
    namespace,
    selector: {
      matchExpressions: [
        {
          key: TEMPLATE_TYPE_LABEL,
          operator: 'Exists',
        },
      ],
    },
    isList: true,
  });
  const [dataSources] = useK8sWatchResource<DataSourceKind[]>({
    namespace: isUpstream() ? KUBEVIRT_OS_IMAGES_NS : OPENSHIFT_OS_IMAGES_NS,
    kind: kubevirtReferenceForModel(DataSourceModel),
    isList: true,
  });
  const [baseTemplates, btLoaded, btError] = useK8sWatchResource<TemplateKind[]>({
    kind: TemplateModel.kind,
    namespace: 'openshift',
    selector: {
      matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
    },
    isList: true,
  });
  const [pods, podsLoaded, podsError] = useK8sWatchResource<PodKind[]>({
    kind: PodModel.kind,
    namespace,
    isList: true,
    selector: {
      matchLabels: { app: CDI_APP_LABEL },
    },
  });
  const [dvs, dvsLoaded, dvsError] = useK8sWatchResource<V1alpha1DataVolume[]>({
    kind: kubevirtReferenceForModel(DataVolumeModel),
    namespace,
    isList: true,
  });
  const [pvcs, pvcsLoaded, pvcsError] = useK8sWatchResource<PersistentVolumeClaimKind[]>({
    kind: PersistentVolumeClaimModel.kind,
    namespace,
    isList: true,
  });
  const [baseImages, baseLoaded, baseError, baseDVs, basePods] = useBaseImages(baseTemplates, true);

  const resourcesLoaded =
    utLoaded && btLoaded && podsLoaded && dvsLoaded && pvcsLoaded && baseLoaded;
  const resourcesLoadError = utError || btError || podsError || dvsError || pvcsError || baseError;

  return React.useMemo(() => {
    const allPods = [...pods, ...basePods];
    const allDVs = [...dvs, ...baseDVs];
    const allPVCs = [...pvcs, ...baseImages];

    return {
      pods: allPods,
      dataVolumes: allDVs,
      pvcs: allPVCs,
      dataSources,
      userTemplates,
      baseTemplates,
      resourcesLoaded,
      resourcesLoadError,
    };
  }, [
    pods,
    basePods,
    dvs,
    baseDVs,
    pvcs,
    baseImages,
    dataSources,
    userTemplates,
    baseTemplates,
    resourcesLoaded,
    resourcesLoadError,
  ]);
};

type useVmTemplatesResourcesValues = {
  pods: PodKind[];
  dataVolumes: V1alpha1DataVolume[];
  pvcs: PersistentVolumeClaimKind[];
  dataSources: DataSourceKind[];
  userTemplates: TemplateKind[];
  baseTemplates: TemplateKind[];
  resourcesLoaded: boolean;
  resourcesLoadError: any;
};
