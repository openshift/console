import { useState, useEffect } from 'react';
import { consoleFetchJSON as coFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import type {
  CRDAdditionalPrinterColumn,
  CRDAdditionalPrinterColumns,
  K8sModel,
} from '@console/internal/module/k8s';

export const useCRDAdditionalPrinterColumns = (
  model: K8sModel,
): [CRDAdditionalPrinterColumn[], boolean] => {
  const [CRDAPC, setCRDAPC] = useState<CRDAdditionalPrinterColumns>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
  }, [model.plural, model.apiGroup]);

  return [CRDAPC?.[model.apiVersion] ?? [], loaded];
};
