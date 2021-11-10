import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Grid,
  GridItem,
  Form,
  FormGroup,
  Label,
  Text,
  TextVariants,
  TextContent,
  TextInput,
} from '@patternfly/react-core';
import { FieldLevelHelp, humanizeBinaryBytes } from '@console/internal/components/utils';
import { K8sResourceKind, NodeKind } from '@console/internal/module/k8s';
import { useDeepCompareMemoize } from '@console/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SelectedNodesTable } from './selected-nodes-table';
import { StretchCluster } from './stretch-cluster';
import { calcPVsCapacity, getSCAvailablePVs } from '../../../../selectors';
import {
  NO_PROVISIONER,
  requestedCapacityTooltip,
  attachDevices,
  attachDevicesWithArbiter,
} from '../../../../constants';
import { OSDSizeDropdown, TotalCapacityText } from '../../../../utils/osd-size-dropdown';
import { getAssociatedNodes } from '../../../../utils/install';
import {
  createWizardNodeState,
  capacityAndNodesValidate,
  isValidStretchClusterTopology,
  getPVAssociatedNodesPerZone,
  NodesPerZoneMap,
  getZonesFromNodesKind,
} from '../../../../utils/create-storage-system';
import { WizardDispatch, WizardNodeState, WizardState } from '../../reducer';
import { pvResource, nodeResource } from '../../../../resources';
import { ValidationMessage } from '../../../../utils/common-ocs-install-el';
import { SelectNodesTable } from '../../select-nodes-table/select-nodes-table';
import { ErrorHandler } from '../../error-handler';

export const SelectNodesText: React.FC<SelectNodesTextProps> = React.memo(({ text }) => {
  const { t } = useTranslation();
  const label = 'cluster.ocs.openshift.io/openshift-storage=""';
  return (
    <TextContent>
      <Text>{text}</Text>
      <Text>
        <Trans t={t} ns="ceph-storage-plugin">
          If not labeled, the selected nodes are labeled <Label color="blue">{{ label }}</Label> to
          make them target hosts for OpenShift Data Foundation
          {/* eslint-disable react/no-unescaped-entities */}'s components.
        </Trans>
      </Text>
    </TextContent>
  );
});

type SelectNodesTextProps = { text: JSX.Element };

const SelectCapacityAndNodes: React.FC<SelectCapacityAndNodesProps> = ({
  dispatch,
  capacity,
  nodes,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    if (!capacity) dispatch({ type: 'capacityAndNodes/capacity', payload: '2Ti' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRowSelected = React.useCallback(
    (selectedNodes: NodeKind[]) => {
      const nodesData = createWizardNodeState(selectedNodes);
      dispatch({ type: 'wizard/nodes', payload: nodesData });
    },
    [dispatch],
  );

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>{t('ceph-storage-plugin~Select capacity')}</Text>
      </TextContent>
      <FormGroup
        fieldId="requested-capacity-dropdown"
        label={t('ceph-storage-plugin~Requested capacity')}
        labelIcon={<FieldLevelHelp>{requestedCapacityTooltip(t)}</FieldLevelHelp>}
      >
        <Grid hasGutter>
          <GridItem span={5}>
            <OSDSizeDropdown
              id="requested-capacity-dropdown"
              selectedKey={capacity as string}
              onChange={(selectedCapacity: string) =>
                dispatch({ type: 'capacityAndNodes/capacity', payload: selectedCapacity })
              }
            />
          </GridItem>
          <GridItem span={7}>
            <TotalCapacityText capacity={capacity as string} />
          </GridItem>
        </Grid>
      </FormGroup>
      <TextContent>
        <Text id="select-nodes" component={TextVariants.h3}>
          {t('ceph-storage-plugin~Select nodes')}
        </Text>
      </TextContent>
      <Grid>
        <GridItem span={11}>
          <SelectNodesText
            text={t(
              'ceph-storage-plugin~Select at least 3 nodes preferably in 3 different zones. It is recommended to start with at least 14 CPUs and 34 GiB per node.',
            )}
          />
        </GridItem>
        <GridItem span={10}>
          <SelectNodesTable nodes={nodes} onRowSelected={onRowSelected} />
        </GridItem>
      </Grid>
    </>
  );
};

type SelectCapacityAndNodesProps = {
  dispatch: WizardDispatch;
  capacity: WizardState['capacityAndNodes']['capacity'];
  nodes: WizardState['nodes'];
};

const SelectedCapacityAndNodes: React.FC<SelectedCapacityAndNodesProps> = ({
  capacity,
  storageClassName,
  enableArbiter,
  arbiterLocation,
  dispatch,
  nodes,
}) => {
  const { t } = useTranslation();
  const [pv, pvLoaded, pvLoadError] = useK8sWatchResource<K8sResourceKind[]>(pvResource);
  const memoizedPv = useDeepCompareMemoize(pv, true);
  const [allNodes, allNodeLoaded, allNodeLoadError] = useK8sWatchResource<NodeKind[]>(nodeResource);
  const memoizedAllNodes = useDeepCompareMemoize(allNodes, true);
  const [hasStrechClusterEnabled, setHasStrechClusterEnabled] = React.useState(false);
  const [zones, setZones] = React.useState([]);

  const pvBySc = React.useMemo(() => getSCAvailablePVs(memoizedPv, storageClassName), [
    memoizedPv,
    storageClassName,
  ]);

  React.useEffect(() => {
    // Updates selected capacity
    if (pvLoaded && !pvLoadError) {
      const pvCapacity = calcPVsCapacity(pvBySc);
      dispatch({
        type: 'capacityAndNodes/capacity',
        payload: pvCapacity,
      });
      dispatch({ type: 'capacityAndNodes/pvCount', payload: pvBySc.length });
    }
  }, [dispatch, pvBySc, pvLoadError, pvLoaded]);

  React.useEffect(() => {
    // Updates selected nodes
    if (allNodeLoaded && !allNodeLoadError && memoizedAllNodes.length && pvBySc.length) {
      const pvNodes = getAssociatedNodes(pvBySc);
      const filteredNodes = memoizedAllNodes.filter((node) => pvNodes.includes(node.metadata.name));
      const nodesData = createWizardNodeState(filteredNodes);
      dispatch({ type: 'wizard/nodes', payload: nodesData });
    }
  }, [dispatch, allNodeLoadError, allNodeLoaded, memoizedAllNodes, pvBySc]);

  React.useEffect(() => {
    // Validates stretch cluster topology
    if (memoizedAllNodes.length && nodes.length) {
      const allZones = getZonesFromNodesKind(memoizedAllNodes);
      const nodesPerZoneMap: NodesPerZoneMap = getPVAssociatedNodesPerZone(nodes);
      const isValidStretchCluster = isValidStretchClusterTopology(nodesPerZoneMap, allZones);

      setHasStrechClusterEnabled(isValidStretchCluster);
      setZones(allZones);
    }
  }, [memoizedAllNodes, nodes]);

  const onArbiterChecked = React.useCallback(
    (isChecked: boolean) =>
      dispatch({ type: 'capacityAndNodes/enableArbiter', payload: isChecked }),
    [dispatch],
  );

  const onZonesSelect = React.useCallback(
    (_event, selection: string) =>
      dispatch({ type: 'capacityAndNodes/arbiterLocation', payload: selection }),
    [dispatch],
  );

  return (
    <ErrorHandler
      error={pvLoadError}
      loaded={pvLoaded && !!capacity}
      loadingMessage={t(
        'ceph-storage-plugin~PersistentVolumes are being provisioned on the selected nodes.',
      )}
      errorMessage={t('ceph-storage-plugin~Error while loading PersistentVolumes.')}
    >
      <>
        <TextContent>
          <Text component={TextVariants.h3}>{t('ceph-storage-plugin~Selected capacity')}</Text>
        </TextContent>
        <FormGroup
          fieldId="available-raw-capacity"
          label={t('ceph-storage-plugin~Available raw capacity')}
        >
          <Grid hasGutter>
            <GridItem span={5}>
              <TextInput
                isReadOnly
                value={humanizeBinaryBytes(capacity).string}
                id="available-raw-capacity"
              />
              <TextContent>
                <Text component={TextVariants.small}>
                  <Trans ns="ceph-storage-plugin">
                    The available capacity is based on all attached disks associated with the
                    selected {/* eslint-disable-next-line react/no-unescaped-entities */}
                    StorageClass <b>{{ storageClassName }}</b>
                  </Trans>
                </Text>
              </TextContent>
              <TextContent />
            </GridItem>
            <GridItem span={7} />
          </Grid>
        </FormGroup>
        {hasStrechClusterEnabled && (
          <StretchCluster
            enableArbiter={enableArbiter}
            arbiterLocation={arbiterLocation}
            zones={zones}
            onChecked={onArbiterChecked}
            onSelect={onZonesSelect}
          />
        )}
        <TextContent>
          <Text id="selected-nodes" component={TextVariants.h3}>
            {t('ceph-storage-plugin~Selected nodes')}
          </Text>
        </TextContent>
        <Grid>
          <GridItem span={11}>
            <SelectNodesText
              text={
                enableArbiter
                  ? attachDevicesWithArbiter(t, storageClassName)
                  : attachDevices(t, storageClassName)
              }
            />
          </GridItem>
          <GridItem span={10}>
            <SelectedNodesTable data={nodes} />
          </GridItem>
        </Grid>
      </>
    </ErrorHandler>
  );
};

type SelectedCapacityAndNodesProps = {
  capacity: WizardState['capacityAndNodes']['capacity'];
  enableArbiter: WizardState['capacityAndNodes']['enableArbiter'];
  storageClassName: string;
  arbiterLocation: WizardState['capacityAndNodes']['arbiterLocation'];
  dispatch: WizardDispatch;
  nodes: WizardNodeState[];
};

export const CapacityAndNodes: React.FC<CapacityAndNodesProps> = ({
  state,
  dispatch,
  storageClass,
  volumeSetName,
  nodes,
}) => {
  const { capacity, enableArbiter, arbiterLocation } = state;

  const isNoProvisioner = storageClass.provisioner === NO_PROVISIONER;

  const validations = capacityAndNodesValidate(nodes, enableArbiter, isNoProvisioner);

  return (
    <Form>
      {isNoProvisioner ? (
        <SelectedCapacityAndNodes
          storageClassName={storageClass.name || volumeSetName}
          enableArbiter={enableArbiter}
          arbiterLocation={arbiterLocation}
          dispatch={dispatch}
          nodes={nodes}
          capacity={capacity}
        />
      ) : (
        <SelectCapacityAndNodes dispatch={dispatch} capacity={capacity} nodes={nodes} />
      )}
      {!!validations.length &&
        !!capacity &&
        validations.map((validation) => (
          <ValidationMessage key={validation} validation={validation} />
        ))}
    </Form>
  );
};

type CapacityAndNodesProps = {
  state: WizardState['capacityAndNodes'];
  storageClass: WizardState['storageClass'];
  nodes: WizardState['nodes'];
  volumeSetName: WizardState['createLocalVolumeSet']['volumeSetName'];
  dispatch: WizardDispatch;
};
