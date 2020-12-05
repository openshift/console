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
import { getName } from '@console/shared';

import {
  storageClassTooltip,
  OCS_DEVICE_SET_REPLICA,
  MINIMUM_NODES,
  attachDevicesWithArbiter,
  attachDevices,
  OCS_DEVICE_SET_ARBITER_REPLICA,
} from '../../../../../constants';
import {
  getNodeInfo,
  shouldDeployAsMinimal,
  filterSCWithNoProv,
  getAssociatedNodes,
  nodesWithoutTaints,
  isArbiterSC,
} from '../../../../../utils/install';
import { ValidationMessage, ValidationType } from '../../../../../utils/common-ocs-install-el';
import {
  SelectNodesText,
  SelectNodesDetails,
  StretchClusterFormGroup,
} from '../../../install-wizard/capacity-and-nodes';
import { State, Action } from '../state';
import AttachedDevicesNodeTable from '../../sc-node-list';
import { PVsAvailableCapacity } from '../../../pvs-available-capacity';
import { getSCAvailablePVs } from '../../../../../selectors';
import { nodeResource, pvResource } from '../../../../../constants/resources';

const validate = (
  scName: string,
  enableMinimal: boolean,
  nodes: NodeKind[],
  stretchClusterChecked: boolean,
  enableFlexibleScaling: boolean,
): ValidationType[] => {
  const validations = [];
  if (enableFlexibleScaling) {
    //  TODO: add check for arbiter
    validations.push(ValidationType.BAREMETAL_FLEXIBLE_SCALING);
  }
  if (enableMinimal) {
    validations.push(ValidationType.MINIMAL);
  }
  if (!scName) {
    validations.push(ValidationType.BAREMETALSTORAGECLASS);
  }
  if (scName && !stretchClusterChecked && nodes.length < MINIMUM_NODES) {
    validations.push(ValidationType.MINIMUMNODES);
  }
  return validations;
};

export const StorageAndNodes: React.FC<StorageAndNodesProps> = ({ state, dispatch }) => {
  const { t } = useTranslation();

  const [pvData, pvLoaded, pvLoadError] = useK8sWatchResource<K8sResourceKind[]>(pvResource);
  const [nodesData, nodesLoaded, nodesError] = useK8sWatchResource<NodeKind[]>(nodeResource);

  const {
    storageClass,
    enableMinimal,
    nodes,
    stretchClusterChecked,
    enableFlexibleScaling,
  } = state;

  let scNodeNames: string[] = []; // names of the nodes, backing the storage of selected storage class
  const scNodeNamesLength = scNodeNames.length;
  const { cpu, memory, zones } = getNodeInfo(nodes);
  const scName: string = state.storageClassName;
  const validations: ValidationType[] = validate(
    scName,
    enableMinimal,
    nodes,
    stretchClusterChecked,
    enableFlexibleScaling,
  );
  const nodesCount: number = nodes.length;

  const zonesCount: number = zones.size;

  if (!pvLoadError && pvData.length && pvLoaded) {
    const pvs: K8sResourceKind[] = getSCAvailablePVs(pvData, scName);
    scNodeNames = getAssociatedNodes(pvs);
  }

  React.useEffect(() => {
    const isMinimal: boolean = shouldDeployAsMinimal(cpu, memory, nodesCount);
    dispatch({ type: 'setEnableMinimal', value: isMinimal });
  }, [cpu, dispatch, memory, nodesCount]);

  React.useEffect(() => {
    const isFlexibleScaling: boolean = scNodeNamesLength && zonesCount < 3;
    dispatch({ type: 'setEnableFlexibleScaling', value: isFlexibleScaling });
  }, [dispatch, zonesCount, scNodeNamesLength]);

  const handleStorageClass = (sc: StorageClassResourceKind) => {
    dispatch({ type: 'setStorageClass', value: sc });
    dispatch({ type: 'setStorageClassName', name: getName(sc) });
  };

  const setNodes = (filteredData: NodeKind[]) =>
    dispatch({ type: 'setNodes', value: filteredData });

  const filterSC = ({ resource }): boolean => {
    const noProvSC = filterSCWithNoProv(resource);
    if (stretchClusterChecked && noProvSC && !nodesError && nodesData.length && nodesLoaded) {
      return isArbiterSC(resource, pvData, nodesData);
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
      <StretchClusterFormGroup
        state={state}
        dispatch={dispatch}
        pvData={pvData}
        nodesData={nodesWithoutTaints(nodesData)}
      />
      <FormGroup
        fieldId="storage-class-dropdown"
        label={t('ceph-storage-plugin~Storage Class')}
        labelIcon={<FieldLevelHelp>{storageClassTooltip(t)}</FieldLevelHelp>}
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
            <PVsAvailableCapacity /* @TODO(refactor): Pv data can be passed directly to this component */
              replica={
                stretchClusterChecked ? OCS_DEVICE_SET_ARBITER_REPLICA : OCS_DEVICE_SET_REPLICA
              }
              data-test-id="ceph-ocs-install-pvs-available-capacity"
              storageClass={storageClass}
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
            text={stretchClusterChecked ? attachDevicesWithArbiter(t) : attachDevices(t)}
            replica={
              stretchClusterChecked ? OCS_DEVICE_SET_ARBITER_REPLICA : OCS_DEVICE_SET_REPLICA
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
            customData={{ filteredNodes: scNodeNames, setNodes, nodes }}
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

type StorageAndNodesProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
};
