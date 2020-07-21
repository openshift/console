import * as React from 'react';
import { match } from 'react-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { ActionGroup, Button, Form } from '@patternfly/react-core';
import {
  NodeKind,
  StorageClassResourceKind,
  referenceForModel,
  k8sCreate,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import {
  withHandlePromise,
  HandlePromiseProps,
  history,
  ButtonBar,
} from '@console/internal/components/utils';
import { setFlag } from '@console/internal/actions/features';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getName } from '@console/shared';
import {
  minSelectedNode,
  defaultRequestSize,
  NO_PROVISIONER,
  OCS_INTERNAL_CR_NAME,
  OCS_DEVICE_SET_REPLICA,
} from '../../../constants';
import { OCSServiceModel } from '../../../models';
import AttachedDevicesNodeTable from './sc-node-list';
import { PVsAvailableCapacity } from '../pvs-available-capacity';
import { OCS_CONVERGED_FLAG, OCS_FLAG } from '../../../features';
import { makeLabelNodesRequest } from '../create-form';
import { LVSResource } from '../../../constants/resources';
import { getOCSRequestData } from '../ocs-request-data';
import {
  OCSAlert,
  SelectNodesSection,
  StorageClassSection,
} from '../../../utils/common-ocs-install-el';
import { filterSCWithNoProv } from '../../../utils/install';
import '../ocs-install.scss';
import './attached-devices.scss';

const makeOCSRequest = (
  selectedData: NodeKind[],
  storageClass: StorageClassResourceKind,
): Promise<any> => {
  const promises = makeLabelNodesRequest(selectedData);
  const scName = getName(storageClass);
  const ocsObj = getOCSRequestData(scName, defaultRequestSize.BAREMETAL, NO_PROVISIONER);

  return Promise.all(promises).then(() => k8sCreate(OCSServiceModel, ocsObj));
};

export const CreateOCS = withHandlePromise<CreateOCSProps & HandlePromiseProps>((props) => {
  const {
    handlePromise,
    errorMessage,
    inProgress,
    match: {
      params: { appName, ns },
    },
  } = props;
  const [filteredNodes, setFilteredNodes] = React.useState<string[]>([]);
  const [storageClass, setStorageClass] = React.useState<StorageClassResourceKind>(null);
  const [nodes, setNodes] = React.useState<NodeKind[]>([]);
  // LVS: Local Volume Set
  const dispatch = useDispatch();
  const [LVSData, LVSLoaded, LVSLoadError] = useK8sWatchResource<K8sResourceKind[]>(LVSResource);

  const handleStorageClass = (sc: StorageClassResourceKind) => {
    setStorageClass(sc);

    if (sc) {
      const [volumeSet] =
        LVSLoaded &&
        !LVSLoadError &&
        LVSData.filter((l) => l?.spec?.storageClassName === sc?.metadata?.name);
      setFilteredNodes(
        volumeSet?.spec?.nodeSelector?.nodeSelectorTerms?.[0]?.matchExpressions?.[0]?.values,
      );
    } else {
      setFilteredNodes([]);
    }
  };

  React.useEffect(() => {
    if ((LVSLoadError || LVSData.length === 0) && LVSLoaded) {
      setFilteredNodes([]);
    }
  }, [LVSData, LVSLoaded, LVSLoadError]);

  const submit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // eslint-disable-next-line promise/catch-or-return
    handlePromise(makeOCSRequest(nodes, storageClass)).then(() => {
      dispatch(setFlag(OCS_CONVERGED_FLAG, true));
      dispatch(setFlag(OCS_FLAG, true));
      history.push(
        `/k8s/ns/${ns}/clusterserviceversions/${appName}/${referenceForModel(
          OCSServiceModel,
        )}/${OCS_INTERNAL_CR_NAME}`,
      );
    });
  };

  const onlyNoProvSC = React.useCallback(filterSCWithNoProv, []);

  return (
    <div className="co-m-pane__form">
      <OCSAlert />
      <Form className="co-m-pane__body-group">
        <StorageClassSection handleStorageClass={handleStorageClass} filterSC={onlyNoProvSC}>
          <PVsAvailableCapacity
            replica={OCS_DEVICE_SET_REPLICA}
            data-test-id="ceph-ocs-install-pvs-available-capacity"
            storageClass={storageClass}
          />
        </StorageClassSection>
        <h3 className="co-m-pane__heading co-m-pane__heading--baseline ceph-ocs-install__pane--margin">
          <div className="co-m-pane__name">Nodes</div>
        </h3>
        {storageClass && filteredNodes.length ? (
          <SelectNodesSection
            table={AttachedDevicesNodeTable}
            customData={{ filteredNodes, nodes, setNodes }}
          />
        ) : (
          <div className="ceph-ocs-install__no-nodes-text--large">No nodes available to show</div>
        )}
        <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
          <ActionGroup className="pf-c-form">
            <Button
              type="button"
              variant="primary"
              onClick={submit}
              isDisabled={(filteredNodes?.length ?? 0) < minSelectedNode}
            >
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={history.goBack}>
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </Form>
    </div>
  );
});

type CreateOCSProps = {
  match: match<{ appName: string; ns: string }>;
};
