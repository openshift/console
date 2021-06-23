import { setFlag, handleError } from '@console/internal/actions/features';
import { k8sList, K8sResourceKind } from '@console/internal/module/k8s';
import { FeatureDetector } from '@console/plugin-sdk';
import { MultiClusterHubModel } from './models/index';

export const MCH_AVAILABILITY_FLAG = 'MULTICLUSTERHUB_AVAILABLITY';

export const detectMCHAvailability: FeatureDetector = async (dispatch) => {
  try {
    const multiclusterHubs = await k8sList(MultiClusterHubModel);
    let isMCH = false;
    if (multiclusterHubs?.length > 0) {
      const multiclusterHub = multiclusterHubs.find(
        (mch: K8sResourceKind) => mch.status.phase === 'Running',
      );
      if (multiclusterHub) {
        isMCH = true;
      }
    }
    dispatch(setFlag(MCH_AVAILABILITY_FLAG, isMCH));
  } catch (err) {
    err?.response?.status === 404
      ? dispatch(setFlag(MCH_AVAILABILITY_FLAG, false))
      : handleError(err, MCH_AVAILABILITY_FLAG, dispatch, detectMCHAvailability);
  }
};
