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

  // Without a model there is nothing to fetch — the hook is immediately
  // loaded.
  if (!model && !loaded) {
    setLoaded(true);
  }

  useEffect(() => {
    if (!model) {
      return;
    }
    coFetchJSON(`/api/console/crd-columns/${model.plural}.${model.apiGroup}`)
      .then((response) => {
        setCRDAPC(response);
        setLoaded(true);
      })
      .catch((e) => {
        setLoaded(false);
        console.log(e.message);
      });
  }, [model]);

  return [CRDAPC?.[model?.apiVersion] ?? [], loaded];
};
