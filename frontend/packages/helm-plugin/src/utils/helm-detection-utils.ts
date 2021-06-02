import { Dispatch } from 'react-redux';
import { setFlag, handleError } from '@console/internal/actions/features';
import { fetchK8s } from '@console/internal/graphql/client';
import { K8sResourceKind, ListKind } from '@console/internal/module/k8s';
import { FeatureDetector } from '@console/plugin-sdk';
import { FLAG_OPENSHIFT_HELM } from '../const';
import { HelmChartRepositoryModel } from '../models';

const checkDisabledHelmCharts = (helmChartRepositories: K8sResourceKind[]): boolean => {
  let isDisabled = true;
  helmChartRepositories.forEach((hcr) => {
    isDisabled = isDisabled && (hcr.spec.disabled || false);
  });
  return isDisabled;
};

export const detectHelmChartRepositories: FeatureDetector = async (dispatch: Dispatch) => {
  let id = null;
  const fetchHelmChartRepositories = () =>
    fetchK8s<ListKind<K8sResourceKind>>(HelmChartRepositoryModel)
      .then((list) => {
        dispatch(setFlag(FLAG_OPENSHIFT_HELM, !checkDisabledHelmCharts(list?.items)));
      })
      .catch((error) => {
        error?.response?.status === 404
          ? dispatch(setFlag(FLAG_OPENSHIFT_HELM, false))
          : handleError(error, FLAG_OPENSHIFT_HELM, dispatch, detectHelmChartRepositories);
        clearInterval(id);
      });
  fetchHelmChartRepositories();
  id = setInterval(fetchHelmChartRepositories, 10 * 1000);
};
