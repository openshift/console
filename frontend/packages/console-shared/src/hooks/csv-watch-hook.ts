import * as React from 'react';
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';
import { referenceForModel } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

type CsvWatchResource = {
  csvData: ClusterServiceVersionKind[];
  csvLoaded: boolean;
  csvError: {};
};
export const useCsvWatchResource = (ns: string): CsvWatchResource => {
  const csvResource = React.useMemo(
    () => ({
      isList: true,
      kind: referenceForModel(ClusterServiceVersionModel),
      namespace: ns,
      optional: true,
    }),
    [ns],
  );

  const [csvData, csvLoaded, csvError] = useK8sWatchResource<ClusterServiceVersionKind[]>(
    csvResource,
  );
  return { csvData, csvLoaded, csvError };
};
