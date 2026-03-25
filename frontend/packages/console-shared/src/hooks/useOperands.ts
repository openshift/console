import { useState, useEffect } from 'react';
import { consoleFetchJSON as coFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import type { K8sResourceCommon } from '@console/internal/module/k8s';

export const useOperands = (
  operatorName: string,
  operatorNamespace: string,
): [K8sResourceCommon[], boolean, string] => {
  const [operands, setOperands] = useState<K8sResourceCommon[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const url = `${window.SERVER_FLAGS.basePath}api/olm/list-operands?name=${operatorName}&namespace=${operatorNamespace}`;
    coFetchJSON(url)
      .then((data) => {
        setOperands(data?.items ?? []);
        setLoaded(true);
        setErrorMessage('');
      })
      .catch((err) => {
        setOperands([]);
        setLoaded(true);
        setErrorMessage(
          `Error loading Operands for ${operatorName} in ${operatorNamespace}: ${err}`,
        );
      });
  }, [operatorName, operatorNamespace]);

  return [operands, loaded, errorMessage];
};
