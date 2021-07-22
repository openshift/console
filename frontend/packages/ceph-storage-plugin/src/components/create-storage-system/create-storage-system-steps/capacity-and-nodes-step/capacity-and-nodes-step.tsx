import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Grid,
  GridItem,
  Form,
  FormGroup,
  Text,
  TextVariants,
  TextContent,
  TextInput,
} from '@patternfly/react-core';
import { FieldLevelHelp, humanizeBinaryBytes } from '@console/internal/components/utils';
import { K8sResourceKind, NodeKind } from '@console/internal/module/k8s';
import { ListPage } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { useDeepCompareMemoize } from '@console/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SelectedNodesTable } from './selected-nodes-table';
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
  getAllZone,
  getTotalMemory,
  getTotalCpu,
  createWizardNodeState,
  capacityAndNodesValidate,
} from '../../../../utils/create-storage-system';

import { WizardDispatch, WizardNodeState, WizardState } from '../../reducer';
import InternalNodeTable from '../../../ocs-install/node-list';
import { SelectNodesText } from '../../../ocs-install/install-wizard/capacity-and-nodes';
import { pvResource, nodeResource } from '../../../../resources';
import './capacity-and-nodes.scss';
import { ValidationMessage } from '../../../../utils/common-ocs-install-el';

const NodesDetails: React.FC<NodesDetailsProps> = React.memo(({ nodes }) => {
  const { t } = useTranslation();

  const totalCpu = getTotalCpu(nodes);
  const totalMemory = getTotalMemory(nodes);
  const zones = getAllZone(nodes);

  return (
    <TextContent>
      <Text data-test-id="nodes-selected">
        {t('ceph-storage-plugin~{{nodeCount, number}} node', {
          nodeCount: nodes.length,
          count: nodes.length,
        })}{' '}
        {t('ceph-storage-plugin~selected ({{cpu}} CPU and {{memory}} on ', {
          cpu: totalCpu,
          memory: humanizeBinaryBytes(totalMemory).string,
        })}
        {t('ceph-storage-plugin~{{zoneCount, number}} zone', {
          zoneCount: zones.size,
          count: zones.size,
        })}
        {')'}
      </Text>
    </TextContent>
  );
});

type NodesDetailsProps = {
  nodes: WizardNodeState[];
};

const SelectCapacityAndNodes: React.FC<SelectCapacityAndNodesProps> = ({
  dispatch,
  capacity,
  nodes,
}) => {
  const { t } = useTranslation();

  const onRowSelected = React.useCallback(
    (selectedNodes: NodeKind[]) => {
      const nodesData = createWizardNodeState(selectedNodes);
      dispatch({ type: 'capacityAndNodes/nodes', payload: nodesData });
    },
    [dispatch],
  );

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>{t('ceph-storage-plugin~Select Capacity')}</Text>
      </TextContent>
      <FormGroup
        fieldId="requested-capacity-dropdown"
        label={t('ceph-storage-plugin~Requested Capacity')}
        labelIcon={<FieldLevelHelp>{requestedCapacityTooltip(t)}</FieldLevelHelp>}
      >
        <Grid hasGutter>
          <GridItem span={5}>
            <OSDSizeDropdown
              id="requested-capacity-dropdown"
              selectedKey={capacity}
              onChange={(selectedCapacity: string) =>
                dispatch({ type: 'capacityAndNodes/capacity', payload: selectedCapacity })
              }
            />
          </GridItem>
          <GridItem span={7}>
            <TotalCapacityText capacity={capacity} />
          </GridItem>
        </Grid>
      </FormGroup>
      <TextContent>
        <Text id="select-nodes" component={TextVariants.h3}>
          {t('ceph-storage-plugin~Select Nodes')}
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
        <GridItem span={10} className="odf-capacity-and-nodes__select-nodes">
          <ListPage
            kind={NodeModel.kind}
            showTitle={false}
            ListComponent={InternalNodeTable}
            nameFilterPlaceholder={t('ceph-storage-plugin~Search by node name...')}
            labelFilterPlaceholder={t('ceph-storage-plugin~Search by node label...')}
            customData={{
              onRowSelected,
              nodes: new Set(nodes.map(({ uid }) => uid)),
            }}
          />
          {!!nodes.length && <NodesDetails nodes={nodes} />}
        </GridItem>
      </Grid>
    </>
  );
};

type SelectCapacityAndNodesProps = {
  dispatch: WizardDispatch;
  capacity: WizardState['capacityAndNodes']['capacity'];
  nodes: WizardState['capacityAndNodes']['nodes'];
};

const SelectedCapacityAndNodes: React.FC<SelectedCapacityAndNodesProps> = ({
  capacity,
  storageClassName,
  enableArbiter,
  dispatch,
  nodes,
}) => {
  const { t } = useTranslation();
  const [pv, pvLoaded, pvLoadError] = useK8sWatchResource<K8sResourceKind[]>(pvResource);
  const memoizedPv = useDeepCompareMemoize(pv);
  const [allNodes, allNodeLoaded, allNodeLoadError] = useK8sWatchResource<NodeKind[]>(nodeResource);
  const memoizedNodes = useDeepCompareMemoize(allNodes);

  React.useEffect(() => {
    if (pvLoaded && !pvLoadError && memoizedPv.length) {
      const pvBySc = getSCAvailablePVs(memoizedPv, storageClassName);
      const pvCapacity = calcPVsCapacity(pvBySc);
      const humanizedCapacity = humanizeBinaryBytes(pvCapacity).string;
      dispatch({ type: 'capacityAndNodes/capacity', payload: humanizedCapacity });
    }
  }, [dispatch, memoizedPv, pvLoadError, pvLoaded, storageClassName]);

  React.useEffect(() => {
    if (memoizedNodes && !allNodeLoadError && memoizedNodes.length && memoizedPv.length) {
      const pvBySc = getSCAvailablePVs(memoizedPv, storageClassName);
      const pvNodes = getAssociatedNodes(pvBySc);
      const filteredNodes = memoizedNodes.filter((node) => pvNodes.includes(node.metadata.name));
      const nodesData = createWizardNodeState(filteredNodes);
      dispatch({ type: 'capacityAndNodes/nodes', payload: nodesData });
    }
  }, [dispatch, allNodeLoadError, allNodeLoaded, memoizedNodes, memoizedPv, storageClassName]);

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>{t('ceph-storage-plugin~Select Capacity')}</Text>
      </TextContent>
      <FormGroup
        fieldId="available-raw-capacity"
        label={t('ceph-storage-plugin~Available Raw Capacity')}
      >
        <Grid hasGutter>
          <GridItem span={5}>
            <TextInput isReadOnly value={capacity} id="available-raw-capacity" />
            <TextContent>
              <Text component={TextVariants.small}>
                <Trans ns="ceph-storage-plugin">
                  The available capacity is based on all attached disks associated with the selected
                  {/* eslint-disable-next-line react/no-unescaped-entities */}
                  StorageClass <em>"{{ storageClassName }}"</em>
                </Trans>
              </Text>
            </TextContent>
            <TextContent />
          </GridItem>
          <GridItem span={7} />
        </Grid>
      </FormGroup>
      <TextContent>
        <Text id="selected-nodes" component={TextVariants.h3}>
          {t('ceph-storage-plugin~Selected Nodes')}
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
        <GridItem span={10} className="odf-capacity-and-nodes__select-nodes">
          <SelectedNodesTable data={nodes} />
          {!!nodes.length && <NodesDetails nodes={nodes} />}
        </GridItem>
      </Grid>
    </>
  );
};

type SelectedCapacityAndNodesProps = {
  capacity: WizardState['capacityAndNodes']['capacity'];
  storageClassName: string;
  enableArbiter: WizardState['capacityAndNodes']['enableArbiter'];
  dispatch: WizardDispatch;
  nodes: WizardNodeState[];
};

export const CapacityAndNodes: React.FC<CapacityAndNodesProps> = ({
  state,
  dispatch,
  storageClass,
}) => {
  const { nodes, capacity, enableArbiter } = state;

  const isNoProvisioner = storageClass.provisioner === NO_PROVISIONER;

  const validations = capacityAndNodesValidate(nodes, enableArbiter);

  return (
    <Form>
      {isNoProvisioner ? (
        <SelectedCapacityAndNodes
          storageClassName={storageClass.name}
          enableArbiter={enableArbiter}
          dispatch={dispatch}
          nodes={nodes}
          capacity={capacity}
        />
      ) : (
        <SelectCapacityAndNodes dispatch={dispatch} capacity={capacity} nodes={nodes} />
      )}
      {!!validations.length &&
        validations.map((validation) => (
          <ValidationMessage key={validation} validation={validation} />
        ))}
    </Form>
  );
};

type CapacityAndNodesProps = {
  state: WizardState['capacityAndNodes'];
  storageClass: WizardState['storageClass'];
  dispatch: WizardDispatch;
};
