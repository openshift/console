import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  GridItem,
  Form,
  FormGroup,
  Text,
  TextVariants,
  TextContent,
} from '@patternfly/react-core';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { StorageClassResourceKind, NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { ListPage } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getName, useFlag } from '@console/shared';
import {
  attachedDevicesStorageClassTooltip,
  OCS_DEVICE_SET_REPLICA,
  MINIMUM_NODES,
  attachDevicesWithArbiter,
  attachDevices,
  OCS_DEVICE_SET_ARBITER_REPLICA,
} from '../../../../constants';
import {
  getNodeInfo,
  shouldDeployAsMinimal,
  isFlexibleScaling,
  filterSCWithNoProv,
  getAssociatedNodes,
  isArbiterSC,
} from '../../../../utils/install';
import { ValidationMessage, ValidationType } from '../../../../utils/common-ocs-install-el';
import {
  SelectNodesText,
  SelectNodesDetails,
  StretchClusterFormGroup,
  EnableTaintNodes,
} from '../../install-wizard/capacity-and-nodes';
import { State, Action } from '../reducer';
import AttachedDevicesNodeTable from '../sc-node-list';
import { PVsAvailableCapacity } from '../../pvs-available-capacity';
import { getSCAvailablePVs } from '../../../../selectors';
import { nodeResource, pvResource } from '../../../../resources';
import { GUARDED_FEATURES } from '../../../../features';

const validate = (
  scName: string,
  enableMinimal: boolean,
  nodes: NodeKind[],
  enableStretchCluster: boolean,
  enableFlexibleScaling: boolean,
): ValidationType[] => {
  const validations = [];
  if (!enableStretchCluster && enableFlexibleScaling) {
    validations.push(ValidationType.ATTACHED_DEVICES_FLEXIBLE_SCALING);
  }
  if (enableMinimal) {
    validations.push(ValidationType.MINIMAL);
  }
  if (!scName) {
    validations.push(ValidationType.BAREMETALSTORAGECLASS);
  }
  if (scName && !enableStretchCluster && nodes.length < MINIMUM_NODES) {
    validations.push(ValidationType.MINIMUMNODES);
  }
  return validations;
};

export const StorageAndNodes: React.FC<StorageAndNodesProps> = ({ state, dispatch, mode }) => {
  const { t } = useTranslation();
  const isFlexibleScalingSupported = useFlag(GUARDED_FEATURES.OCS_FLEXIBLE_SCALING);
  const isArbiterSupported = useFlag(GUARDED_FEATURES.OCS_ARBITER);
  const isTaintSupported = useFlag(GUARDED_FEATURES.OCS_TAINT_NODES);
  const [pvData, pvLoaded, pvLoadError] = useK8sWatchResource<K8sResourceKind[]>(pvResource);
  const [nodesData, nodesLoaded, nodesError] = useK8sWatchResource<NodeKind[]>(nodeResource);

  const {
    storageClass,
    storageClassName: scName,
    enableMinimal,
    nodes,
    stretchClusterChecked,
    enableFlexibleScaling,
  } = state;

  const scNodeNames: React.MutableRefObject<string[]> = React.useRef([]); // names of the nodes, backing the storage of selected storage class

  const { cpu, memory, zones } = getNodeInfo(nodes);
  const nodesCount: number = nodes.length;
  const zonesCount: number = zones.size;

  const hasStretchClusterChecked = isArbiterSupported && stretchClusterChecked;

  const validations: ValidationType[] = validate(
    scName,
    enableMinimal,
    nodes,
    hasStretchClusterChecked,
    isFlexibleScalingSupported && enableFlexibleScaling,
  );

  React.useEffect(() => {
    if (!pvLoadError && pvData.length && pvLoaded) {
      const pvs: K8sResourceKind[] = getSCAvailablePVs(pvData, scName);
      scNodeNames.current = getAssociatedNodes(pvs);
      dispatch({ type: 'setAvailablePvsCount', value: pvs.length });
    }
  }, [dispatch, pvData, pvLoaded, pvLoadError, scName]);

  React.useEffect(() => {
    const isMinimal: boolean = shouldDeployAsMinimal(cpu, memory, nodesCount);
    dispatch({ type: 'setEnableMinimal', value: isMinimal });
  }, [cpu, dispatch, memory, nodesCount]);

  React.useEffect(() => {
    if (isFlexibleScalingSupported) {
      dispatch({
        type: 'setEnableFlexibleScaling',
        value: !stretchClusterChecked && isFlexibleScaling(nodesCount, zonesCount),
      });
    }
  }, [dispatch, zonesCount, nodesCount, stretchClusterChecked, isFlexibleScalingSupported]);

  const handleStorageClass = (sc: StorageClassResourceKind) => {
    dispatch({ type: 'setStorageClass', value: sc });
    dispatch({ type: 'setStorageClassName', name: getName(sc) });
  };

  const setNodes = (filteredData: NodeKind[]) =>
    dispatch({ type: 'setNodes', value: filteredData });

  const filterSC = ({ resource }): boolean => {
    const noProvSC = filterSCWithNoProv(resource);
    if (hasStretchClusterChecked && noProvSC && !nodesError && nodesData.length && nodesLoaded) {
      return isArbiterSC(getName(resource), pvData, nodesData);
    }
    return noProvSC;
  };

  return (
    <Form>
      <TextContent>
        <Text component={TextVariants.h3} className="ocs-install-wizard__h3">
          {t('ceph-storage-plugin~Capacity')}
        </Text>
      </TextContent>
      {isArbiterSupported && (
        <StretchClusterFormGroup
          state={state}
          dispatch={dispatch}
          pvData={pvData}
          nodesData={nodesData}
        />
      )}
      <FormGroup
        fieldId="storage-class-dropdown"
        label={t('ceph-storage-plugin~Storage Class')}
        labelIcon={<FieldLevelHelp>{attachedDevicesStorageClassTooltip(t)}</FieldLevelHelp>}
      >
        <Grid hasGutter>
          <GridItem span={5}>
            <StorageClassDropdown
              id="storage-class-dropdown"
              onChange={handleStorageClass}
              selectedKey={state.storageClassName}
              filter={filterSC}
              noSelection
              hideClassName="ocs-install-wizard__storage-class-label"
            />
            <PVsAvailableCapacity
              replica={
                hasStretchClusterChecked ? OCS_DEVICE_SET_ARBITER_REPLICA : OCS_DEVICE_SET_REPLICA
              }
              data-test-id="ceph-ocs-install-pvs-available-capacity"
              storageClass={storageClass}
              data={pvData}
              loaded={pvLoaded}
              loadError={pvLoadError}
            />
          </GridItem>
          <GridItem span={7} />
        </Grid>
      </FormGroup>
      <TextContent>
        <Text id="select-nodes" component={TextVariants.h3} className="ocs-install-wizard__h3">
          {t('ceph-storage-plugin~Selected Nodes')}
        </Text>
      </TextContent>
      <Grid>
        <GridItem span={11}>
          <SelectNodesText
            text={
              hasStretchClusterChecked
                ? attachDevicesWithArbiter(t, scName)
                : attachDevices(t, scName)
            }
          />
        </GridItem>
        <GridItem span={10} className="ocs-install-wizard__select-nodes">
          <ListPage
            kind={NodeModel.kind}
            showTitle={false}
            ListComponent={AttachedDevicesNodeTable}
            hideLabelFilter
            hideNameLabelFilters
            customData={{ filteredNodes: scNodeNames.current, setNodes, nodes }}
          />
          {!!nodesCount && (
            <SelectNodesDetails cpu={cpu} memory={memory} zones={zones.size} nodes={nodesCount} />
          )}
          {isTaintSupported && <EnableTaintNodes state={state} dispatch={dispatch} mode={mode} />}
          {!!validations.length &&
            validations.map((validation) => (
              <ValidationMessage key={validation} validation={validation} />
            ))}
        </GridItem>
      </Grid>
    </Form>
  );
};

type StorageAndNodesProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  mode: string;
};
