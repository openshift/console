import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  GridItem,
  Form,
  FormGroup,
  Text,
  TextVariants,
  TextContent,
  Checkbox,
  Alert,
  AlertActionCloseButton,
} from '@patternfly/react-core';
import { Dropdown, FieldLevelHelp } from '@console/internal/components/utils';
import { StorageClassResourceKind, NodeKind } from '@console/internal/module/k8s';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { ListPage } from '@console/internal/components/factory';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NodeModel } from '@console/internal/models';
import { getName, getUID, useDeepCompareMemoize } from '@console/shared';
import { storageClassTooltip, requestedCapacityTooltip, arbiterText } from '../../../../constants';
import { OSDSizeDropdown, TotalCapacityText } from '../../../../utils/osd-size-dropdown';
import { InternalClusterState, InternalClusterAction, ActionType } from '../reducer';
import {
  getNodeInfo,
  shouldDeployAsMinimal,
  filterSCWithoutNoProv,
  nodesWithoutTaints,
  countNodesPerZone,
  getZone,
} from '../../../../utils/install';
import { ValidationMessage, ValidationType } from '../../../../utils/common-ocs-install-el';
import InternalNodeTable from '../../node-list';
import { SelectNodesText, SelectNodesDetails } from '../../install-wizard/capacity-and-nodes';
import { nodeResource } from '../../../../constants/resources';

const validate = (
  scName,
  enableMinimal,
  enableFlexibleScaling,
  enableStretchCluster,
  isArbiterValid,
): ValidationType[] => {
  const validations = [];
  if (enableStretchCluster && isArbiterValid) {
    validations.push(ValidationType.INTERNAL_STRETCH_CLUSTER);
  }
  if (!enableStretchCluster && enableFlexibleScaling) {
    validations.push(ValidationType.INTERNAL_FLEXIBLE_SCALING);
  }
  if (enableMinimal) {
    validations.push(ValidationType.MINIMAL);
  }
  if (!scName) {
    validations.push(ValidationType.INTERNALSTORAGECLASS);
  }
  return validations;
};

const isArbiterDisabled = (nodesData: NodeKind[], validateSelectedNodes?: boolean) => {
  const validation = {
    nodesLength: validateSelectedNodes ? 4 : 5,
    zoneLength: validateSelectedNodes ? 2 : 3,
  };
  if (nodesData.length < validation.nodesLength) return true;
  const uniqZones: Set<string> = new Set(nodesData.map(getZone));
  if (uniqZones.size !== validation.zoneLength) return true;
  const nodesPerZone = countNodesPerZone(nodesData);
  let count = 0;
  Object.keys(nodesPerZone).forEach((zone) => {
    if (nodesPerZone[zone] >= 2) count += 1;
  });
  return count < 2;
};

export const StretchClusterFormGroup: React.FC<stretchClusterFormGroupProps> = ({
  state,
  dispatch,
}) => {
  const { t } = useTranslation();
  const { enableStretchCluster, selectedArbiterZone, nodes } = state;
  const [zonesOption, setZonesOptions] = React.useState({});
  const [showInfoAlert, setShowInfoAlert] = React.useState(true);
  const [nodesData, nodesLoaded] = useK8sWatchResource<NodeKind[]>(nodeResource);
  const nodesDataMemoized: NodeKind[] = useDeepCompareMemoize(nodesWithoutTaints(nodesData), true);
  const uniqZones: Set<string> = new Set(nodesDataMemoized.map(getZone));

  React.useEffect(() => {
    dispatch({
      type: ActionType.SET_ARBITER_VALID,
      payload: enableStretchCluster && isArbiterDisabled(nodes, true),
    });
    if (nodesLoaded && isArbiterDisabled(nodesDataMemoized)) {
      dispatch({ type: ActionType.SET_ENABLE_STRETCH_CLUSTER, payload: false });
    }
  }, [dispatch, enableStretchCluster, nodesDataMemoized, nodes, nodesLoaded]);

  React.useEffect(() => {
    if (nodesLoaded && enableStretchCluster) {
      setZonesOptions(_.zipObject([...uniqZones], [...uniqZones]));
      dispatch({ type: ActionType.SET_ARBITER_ZONE, payload: [...uniqZones]?.[0] });
    }
  }, [dispatch, enableStretchCluster, nodesLoaded, uniqZones]);
  return (
    <FormGroup fieldId="arbiter-cluster" label={t('ceph-storage-plugin~Stretch Cluster')}>
      <Checkbox
        id="arbiter-cluster"
        isChecked={enableStretchCluster}
        label={t('ceph-storage-plugin~Enable arbiter')}
        description={t(
          'ceph-storage-plugin~To support high availability when two data centers can be used, enable arbiter to get the valid quorum between two data centers.',
        )}
        isDisabled={isArbiterDisabled(nodesDataMemoized)}
        onChange={(isChecked: boolean) =>
          dispatch({ type: ActionType.SET_ENABLE_STRETCH_CLUSTER, payload: isChecked })
        }
      />
      {showInfoAlert && (
        <Alert
          aria-label={t('ceph-storage-plugin~Arbiter minimum requirements')}
          className="co-alert ceph-ocs-install__lso-install-alert"
          variant="info"
          title={t('ceph-storage-plugin~Arbiter minimum requirements')}
          isInline
          actionClose={<AlertActionCloseButton onClose={() => setShowInfoAlert(false)} />}
        >
          {arbiterText(t)}
        </Alert>
      )}
      {enableStretchCluster && (
        <Grid hasGutter>
          <GridItem span={5}>
            <FormGroup
              label={t('ceph-storage-plugin~Select an arbiter zone')}
              fieldId="arbiter-zone-dropdown"
              className="ceph-ocs-install__select-arbiter-zone"
            >
              <Dropdown
                aria-label={t('ceph-storage-plugin~Arbiter zone selection')}
                id="arbiter-zone-dropdown"
                dropDownClassName="dropdown dropdown--full-width"
                items={zonesOption}
                title={selectedArbiterZone}
                selectedKey={selectedArbiterZone}
                onChange={(type: string) =>
                  dispatch({ type: ActionType.SET_ARBITER_ZONE, payload: zonesOption[type] })
                }
              />
            </FormGroup>
          </GridItem>
        </Grid>
      )}
    </FormGroup>
  );
};

type stretchClusterFormGroupProps = {
  state: InternalClusterState;
  dispatch: React.Dispatch<InternalClusterAction>;
};

export const SelectCapacityAndNodes: React.FC<SelectCapacityAndNodesProps> = ({
  state,
  dispatch,
}) => {
  const { t } = useTranslation();
  const {
    nodes: selectedNodes,
    capacity: selectedCapacity,
    storageClass,
    enableMinimal,
    enableFlexibleScaling,
    enableStretchCluster,
    isArbiterValid,
    selectedArbiterZone,
  } = state;
  const { cpu, memory, zones } = getNodeInfo(selectedNodes);
  const scName: string = getName(storageClass);
  const nodesCount = selectedNodes.length;
  const zonesCount = zones.size;
  const validations = validate(
    scName,
    enableMinimal,
    enableFlexibleScaling,
    enableStretchCluster,
    isArbiterValid,
  );

  React.useEffect(() => {
    const isMinimal = shouldDeployAsMinimal(cpu, memory, nodesCount);
    dispatch({ type: ActionType.SET_ENABLE_MINIMAL, payload: isMinimal });
  }, [cpu, dispatch, memory, nodesCount]);

  React.useEffect(() => {
    const isFlexibleScaling = nodesCount && zonesCount < 3;
    dispatch({ type: ActionType.SET_ENABLE_FLEXIBLE_SCALING, payload: isFlexibleScaling });
  }, [dispatch, zonesCount, nodesCount]);

  return (
    <Form>
      <TextContent>
        <Text component={TextVariants.h3} className="ocs-install-wizard__h3">
          {t('ceph-storage-plugin~Select Capacity')}
        </Text>
      </TextContent>
      <StretchClusterFormGroup state={state} dispatch={dispatch} />
      <FormGroup
        fieldId="storage-class-dropdown"
        label={t('ceph-storage-plugin~Storage Class')}
        labelIcon={<FieldLevelHelp>{storageClassTooltip(t)}</FieldLevelHelp>}
      >
        <Grid hasGutter>
          <GridItem span={5}>
            <StorageClassDropdown
              id="storage-class-dropdown"
              onChange={(sc: StorageClassResourceKind) =>
                dispatch({ type: ActionType.SET_STORAGE_CLASS, payload: sc })
              }
              noSelection
              selectedKey={getName(storageClass)}
              filter={filterSCWithoutNoProv}
              hideClassName="ocs-install-wizard__storage-class-label"
            />
          </GridItem>
          <GridItem span={7} />
        </Grid>
      </FormGroup>
      <FormGroup
        fieldId="requested-capacity-dropdown"
        label={t('ceph-storage-plugin~Requested Capacity')}
        labelIcon={<FieldLevelHelp>{requestedCapacityTooltip(t)}</FieldLevelHelp>}
      >
        <Grid hasGutter>
          <GridItem span={5}>
            <OSDSizeDropdown
              id="requested-capacity-dropdown"
              selectedKey={selectedCapacity}
              onChange={(capacity: string) =>
                dispatch({ type: ActionType.SET_CAPACITY, payload: capacity })
              }
            />
          </GridItem>
          <GridItem span={7}>
            <TotalCapacityText capacity={selectedCapacity} />
          </GridItem>
        </Grid>
      </FormGroup>
      <TextContent>
        <Text id="select-nodes" component={TextVariants.h3} className="ocs-install-wizard__h3">
          {t('ceph-storage-plugin~Select Nodes')}
        </Text>
      </TextContent>
      <Grid>
        <GridItem span={11}>
          <SelectNodesText
            text={
              enableStretchCluster
                ? t(
                    'ceph-storage-plugin~Select at least 2 nodes preferably in 2 different zones (in additional to the selected Arbiter Zone). It is recommended to start with at least 14 CPUs and 34 GiB per node.',
                  )
                : t(
                    'ceph-storage-plugin~Select at least 3 nodes preferably in 3 different zones. It is recommended to start with at least 14 CPUs and 34 GiB per node.',
                  )
            }
          />
        </GridItem>
        <GridItem span={10} className="ocs-install-wizard__select-nodes">
          <ListPage
            kind={NodeModel.kind}
            showTitle={false}
            ListComponent={InternalNodeTable}
            nameFilterPlaceholder={t('ceph-storage-plugin~Search by node name...')}
            labelFilterPlaceholder={t('ceph-storage-plugin~Search by node label...')}
            customData={{
              onRowSelected: (nodes: NodeKind[]) =>
                dispatch({ type: ActionType.SET_NODES, payload: nodes }),
              nodes: new Set(state.nodes.map(getUID)),
              enableStretchCluster,
              selectedArbiterZone,
            }}
          />
          {!!nodesCount && (
            <SelectNodesDetails cpu={cpu} memory={memory} zones={zones.size} nodes={nodesCount} />
          )}
          {!!validations.length &&
            validations.map((validation) => <ValidationMessage validation={validation} />)}
        </GridItem>
      </Grid>
    </Form>
  );
};

type SelectCapacityAndNodesProps = {
  state: InternalClusterState;
  dispatch: React.Dispatch<InternalClusterAction>;
};
