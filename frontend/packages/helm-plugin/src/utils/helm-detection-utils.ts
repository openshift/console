import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { fetchK8s } from '@console/internal/graphql/client';
import { K8sResourceKind, ListKind } from '@console/internal/module/k8s';
import { FLAG_OPENSHIFT_HELM } from '../const';
import { HelmChartRepositoryModel } from '../models';

const checkDisabledHelmCharts = (helmChartRepositories: K8sResourceKind[]): boolean => {
  let isDisabled = true;
  helmChartRepositories.forEach((hcr) => {
    isDisabled = isDisabled && (hcr.spec.disabled || false);
  });
  return isDisabled;
};

export const detectHelmChartRepositories = async (setFeatureFlag: SetFeatureFlag) => {
  let id = null;
  const fetchHelmChartRepositories = () =>
    fetchK8s<ListKind<K8sResourceKind>>(HelmChartRepositoryModel)
      .then((list) => {
        setFeatureFlag(FLAG_OPENSHIFT_HELM, !checkDisabledHelmCharts(list?.items));
      })
      .catch((error) => {
        error?.response?.status === 404
          ? setFeatureFlag(FLAG_OPENSHIFT_HELM, false)
          : setFeatureFlag(FLAG_OPENSHIFT_HELM, undefined);
        clearInterval(id);
      });
  fetchHelmChartRepositories();
  id = setInterval(fetchHelmChartRepositories, 10 * 1000);
};
