import * as React from 'react';
import {
  useK8sWatchResources,
  WatchK8sResource,
  WatchK8sResult,
} from '@console/internal/components/utils/k8s-watch-hook';
import { getParameterValue } from '../selectors/selectors';
import { TEMPLATE_DATAVOLUME_NAMESPACE_PARAMETER } from '../constants';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { PersistentVolumeClaimKind, TemplateKind } from '@console/internal/module/k8s';

export const usePVCBaseImages = (
  commonTemplates: TemplateKind[],
): WatchK8sResult<PersistentVolumeClaimKind[]> => {
  const resourceWatches = React.useMemo(() => {
    const dataVolumeNamespaces = [
      ...new Set(
        (commonTemplates || [])
          .map((template) => getParameterValue(template, TEMPLATE_DATAVOLUME_NAMESPACE_PARAMETER))
          .filter((ns) => !!ns),
      ),
    ];

    return dataVolumeNamespaces.reduce(
      (acc, ns: string) => ({
        ...acc,
        [ns]: {
          kind: PersistentVolumeClaimModel.kind,
          namespace: ns,
          isList: true,
          optional: true,
        } as WatchK8sResource,
      }),
      {},
    );
  }, [commonTemplates]);

  const dataVolumePVCs = useK8sWatchResources<{ [key: string]: PersistentVolumeClaimKind[] }>(
    resourceWatches,
  );

  return React.useMemo(() => {
    const values = Object.values(dataVolumePVCs);

    const loaded = values.every((dv) => dv.loaded);
    const loadError = values.find((dv) => dv.loadError);
    const data = values.reduce((acc, dv) => acc.concat(dv.data), [] as PersistentVolumeClaimKind[]);

    return [data, loaded, loadError];
  }, [dataVolumePVCs]);
};
