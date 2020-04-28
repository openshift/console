import { K8sResourceKind } from '@console/internal/module/k8s';
import { InfrastructureModel } from '@console/internal/models';
import { getInfrastructurePlatform } from '@console/shared/src/selectors/infrastructure';
import { setFlag, handleError } from '@console/internal/actions/features';
import { ActionFeatureFlagDetector } from '@console/plugin-sdk';
import { fetchURL } from '@console/internal/graphql/client';

export const BAREMETAL_FLAG = 'BAREMETAL';
export const NODE_MAINTENANCE_FLAG = 'NODE_MAINTENANCE';
export const CEPH_FLAG = 'CEPH';

export const detectBaremetalPlatform: ActionFeatureFlagDetector = (dispatch) =>
  fetchURL<K8sResourceKind>(`/apis//${InfrastructureModel.plural}/cluster`).then(
    (infra) =>
      dispatch(setFlag(BAREMETAL_FLAG, getInfrastructurePlatform(infra) === 'BareMetal')),
    (err) => {
      err?.response?.status === 404
        ? dispatch(setFlag(BAREMETAL_FLAG, false))
        : handleError(err, BAREMETAL_FLAG, dispatch, detectBaremetalPlatform);
    },
  );
