import { useMemo } from 'react';
import { referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { CSVDefaultActions } from './csv-actions';

export const useDefaultCSVActions = ({ csvName, resource }) => {
  const [k8sModel, inFlight] = useK8sModel(referenceFor(resource));

  const actions = useMemo(
    () => [
      CSVDefaultActions.Edit(k8sModel, resource, csvName),
      CSVDefaultActions.Delete(k8sModel, resource, csvName),
    ],
    [csvName, resource, k8sModel],
  );

  return useMemo(() => [actions, !inFlight, undefined], [actions, inFlight]);
};
