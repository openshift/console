import { useState, useEffect } from 'react';
import type {
  CRDAdditionalPrinterColumn,
  CRDAdditionalPrinterColumns,
  K8sModel,
} from '@console/internal/module/k8s';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';

export const useCRDAdditionalPrinterColumns = (
  model: K8sModel | undefined,
): [CRDAdditionalPrinterColumn[], boolean] => {
  const [CRDAPC, setCRDAPC] = useState<CRDAdditionalPrinterColumns>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!model) {
      setLoaded(true);
      return;
    }
    coFetchJSON(`/api/console/crd-columns/${model.plural}.${model.apiGroup}`)
      .then((response) => {
        setCRDAPC(response);
        setLoaded(true);
      })
      .catch((e) => {
        setLoaded(false);
        // eslint-disable-next-line no-console
        console.log(e.message);
      });
  }, [model]);

  return [CRDAPC?.[model?.apiVersion] ?? [], loaded];
};
