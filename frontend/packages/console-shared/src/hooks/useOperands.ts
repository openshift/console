import * as React from 'react';
import { coFetchJSON } from '@console/internal/co-fetch';
import { K8sResourceCommon } from '@console/internal/module/k8s';

export const useOperands = (
  operatorName: string,
  operatorNamespace: string,
): [K8sResourceCommon[], boolean, string] => {
  const [operands, setOperands] = React.useState<K8sResourceCommon[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    const url = `${window.SERVER_FLAGS.basePath}api/list-operands?name=${operatorName}&namespace=${operatorNamespace}`;
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
