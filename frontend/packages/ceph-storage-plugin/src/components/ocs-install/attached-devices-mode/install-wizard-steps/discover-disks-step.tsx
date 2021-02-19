import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { LocalVolumeDiscoveryBody } from '@console/local-storage-operator-plugin/src/components/local-volume-discovery/body';
import { NodeKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getNodesByHostNameLabel } from '@console/local-storage-operator-plugin/src/utils';
import {
  createLocalVolumeDiscovery,
  updateLocalVolumeDiscovery,
} from '@console/local-storage-operator-plugin/src/components/local-volume-discovery/request';
import { OCS_TOLERATION } from '@console/ceph-storage-plugin/src/constants';
import { Action } from '../reducer';
import { RequestErrors } from '../../install-wizard/review-and-create';
import { hasNoTaints, hasOCSTaint } from '../../../../utils/install';
import { nodeResource } from '../../../../resources';
import '../attached-devices.scss';

export const DiscoverDisks: React.FC<DiscoverDisksProps> = ({
  allNodes,
  selectNodes,
  isSelectNodes,
  error,
  inProgress,
  dispatch,
}) => {
  const [nodesData, nodesLoaded, nodesLoadError] = useK8sWatchResource<NodeKind[]>(nodeResource);

  React.useEffect(() => {
    if (nodesLoaded && !nodesLoadError && nodesData.length !== 0) {
      const filteredNodes: NodeKind[] = nodesData.filter(
        (node) => hasNoTaints(node) || hasOCSTaint(node),
      );
      dispatch({ type: 'setLvdAllNodes', value: filteredNodes });
    }
  }, [dispatch, nodesData, nodesLoadError, nodesLoaded]);

  return (
    <>
      <Form noValidate={false} className="ceph-ocs-install__auto-detect-table">
        <LocalVolumeDiscoveryBody
          allNodes={allNodes}
          selectNodes={selectNodes}
          showSelectNodes={isSelectNodes}
          setShowSelectNodes={() =>
            dispatch({ type: 'setLvdIsSelectNodes', value: !isSelectNodes })
          }
          setSelectNodes={(nodes) => dispatch({ type: 'setLvdSelectNodes', value: nodes })}
        />
      </Form>
      <RequestErrors errorMessage={error} inProgress={inProgress} />
    </>
  );
};

type DiscoverDisksProps = {
  isSelectNodes: boolean;
  allNodes: NodeKind[];
  selectNodes: NodeKind[];
  error: string;
  inProgress: boolean;
  dispatch: React.Dispatch<Action>;
};

export const makeLocalVolumeDiscoverRequest = async (
  discoveryNodes: NodeKind[],
  dispatch: React.Dispatch<Action>,
  ns: string,
  onNext: () => void,
) => {
  dispatch({ type: 'setLvdInProgress', value: true });
  const setError = (err) => dispatch({ type: 'setLvdError', value: err });
  const nodes: string[] = getNodesByHostNameLabel(discoveryNodes);
  try {
    await updateLocalVolumeDiscovery(nodes, ns, setError);
    onNext();
  } catch (error) {
    if (error?.response?.status === 404) {
      try {
        await createLocalVolumeDiscovery(nodes, ns, OCS_TOLERATION);
        onNext();
      } catch (createError) {
        setError(createError.message);
      }
    } else {
      dispatch({ type: 'setLvdError', value: error.message });
    }
  } finally {
    dispatch({ type: 'setLvsAllNodes', value: discoveryNodes });
    dispatch({ type: 'setLvdInProgress', value: false });
  }
};
