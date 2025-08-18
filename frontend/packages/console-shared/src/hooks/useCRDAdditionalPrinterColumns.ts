import { useState, useEffect } from 'react';
import { consoleFetchJSON as coFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import {
  CRDAdditionalPrinterColumn,
  CRDAdditionalPrinterColumns,
  K8sModel,
} from '@console/internal/module/k8s';

export const useCRDAdditionalPrinterColumns = (model: K8sModel): CRDAdditionalPrinterColumn[] => {
  const [CRDAPC, setCRDAPC] = useState<CRDAdditionalPrinterColumns>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coFetchJSON(`/api/console/crd-columns/${model.plural}.${model.apiGroup}`)
      .then((response) => {
        setCRDAPC(response);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        // eslint-disable-next-line no-console
        console.log(e.message);
      });
  }, [model.plural, model.apiGroup]);

  return !loading ? CRDAPC?.[model.apiVersion] ?? [] : [];
};
