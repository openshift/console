import * as React from 'react';
import {
  useK8sWatchResources,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel, PodModel } from '@console/internal/models';
import { PersistentVolumeClaimKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { getParameterValue } from '../selectors/selectors';
import { TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER } from '../constants';
import { V1alpha1DataVolume } from '../types/vm/disk/V1alpha1DataVolume';
import { DataVolumeModel } from '../models';

type BaseImages = [PersistentVolumeClaimKind[], boolean, any, V1alpha1DataVolume[], PodKind[]];

export const useBaseImages = (
  commonTemplates: TemplateKind[],
  dataVolumesAndPods?: boolean,
): BaseImages => {
  const [pvcWatches, dvWatches, podWatches] = React.useMemo(() => {
    const namespaces = [
      ...new Set(
        (commonTemplates || [])
          .map((template) => getParameterValue(template, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER))
          .filter((ns) => !!ns),
      ),
    ];

    return [
      namespaces.reduce<{ [key: string]: WatchK8sResource }>(
        (acc, ns) => ({
          ...acc,
          [ns]: {
            kind: PersistentVolumeClaimModel.kind,
            namespace: ns,
            isList: true,
          } as WatchK8sResource,
        }),
        {},
      ),
      namespaces.reduce<{ [key: string]: WatchK8sResource }>(
        (acc, ns) => ({
          ...acc,
          [ns]: {
            kind: DataVolumeModel.kind,
            namespace: ns,
            isList: true,
          } as WatchK8sResource,
        }),
        {},
      ),
      namespaces.reduce<{ [key: string]: WatchK8sResource }>(
        (acc, ns) => ({
          ...acc,
          [ns]: {
            kind: PodModel.kind,
            namespace: ns,
            isList: true,
          } as WatchK8sResource,
        }),
        {},
      ),
    ];
  }, [commonTemplates]);

  const pvcs = useK8sWatchResources<{ [key: string]: PersistentVolumeClaimKind[] }>(pvcWatches);
  const dvs = useK8sWatchResources<{ [key: string]: V1alpha1DataVolume[] }>(
    dataVolumesAndPods ? dvWatches : {},
  );
  const pods = useK8sWatchResources<{ [key: string]: PodKind[] }>(
    dataVolumesAndPods ? podWatches : {},
  );

  return React.useMemo(() => {
    const pvcValues = Object.values(pvcs);
    const dvValues = Object.values(dvs);
    const podValues = Object.values(pods);

    const loaded = [...pvcValues, ...dvValues, ...podValues].every((value) => value.loaded);
    const loadError = [...pvcValues, ...dvValues, ...podValues].find((value) => value.loadError);
    const pvcData = pvcValues.reduce<PersistentVolumeClaimKind[]>(
      (acc, pvc) => acc.concat(pvc.data),
      [],
    );
    const dvData = dvValues.reduce<V1alpha1DataVolume[]>((acc, dv) => acc.concat(dv.data), []);
    const podData = podValues.reduce<PodKind[]>((acc, pod) => acc.concat(pod.data), []);

    return [pvcData, loaded, loadError, dvData, podData];
  }, [dvs, pods, pvcs]);
};
