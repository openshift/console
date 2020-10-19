import * as React from 'react';
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
} from '../../../../../constants';
import {
  getNodeInfo,
  shouldDeployAsMinimal,
  filterSCWithNoProv,
  getAssociatedNodes,
} from '../../../../../utils/install';
import {
  ValidationMessage,
  ActionValidationMessage,
  VALIDATIONS,
  Validation,
} from '../../../../../utils/common-ocs-install-el';
import { SelectNodesText, SelectNodesDetails } from '../../../install-wizard/capacity-and-nodes';
import { State, Action } from '../state';
import AttachedDevicesNodeTable from '../../sc-node-list';
import { PVsAvailableCapacity } from '../../../pvs-available-capacity';
import { getSCAvailablePVs } from '../../../../../selectors';
import { pvResource } from '../../../../../constants/resources';

const validate = (scName: string, enableMinimal: boolean, nodes: NodeKind[]): Validation[] => {
  const validations = [];
  if (enableMinimal) {
    validations.push(VALIDATIONS.MINIMAL);
  }
  if (!scName) {
    validations.push(VALIDATIONS.BAREMETALSTORAGECLASS);
  }
  if (scName && nodes.length < MINIMUM_NODES) {
    validations.push(VALIDATIONS.MINIMUMNODES);
  }
  return validations;
};

export const StorageAndNodes: React.FC<StorageAndNodesProps> = ({ state, dispatch }) => {
  const [pvData, pvLoaded, pvLoadError] = useK8sWatchResource<K8sResourceKind[]>(pvResource);

  const { storageClass, enableMinimal, nodes } = state;

  let scNodeNames: string[] = []; // names of the nodes, backing the storage of selected storage class
  const { cpu, memory, zones } = getNodeInfo(nodes);
  const scName: string = getName(storageClass);
  const validations: Validation[] = validate(scName, enableMinimal, nodes);
  const nodesCount: number = nodes.length;

  if (!pvLoadError && pvData.length && pvLoaded) {
    const pvs: K8sResourceKind[] = getSCAvailablePVs(pvData, scName);
    scNodeNames = getAssociatedNodes(pvs);
  }

  React.useEffect(() => {
    const isMinimal: boolean = shouldDeployAsMinimal(cpu, memory, nodesCount);
    dispatch({ type: 'setEnableMinimal', value: isMinimal });
  }, [cpu, dispatch, memory, nodesCount]);

  const handleStorageClass = (sc: StorageClassResourceKind) => {
    dispatch({ type: 'setStorageClass', value: sc });
  };

  const setNodes = (filteredData: NodeKind[]) =>
    dispatch({ type: 'setNodes', value: filteredData });

  return (
    <Form>
      <TextContent>
        <Text component={TextVariants.h3} className="ocs-install-wizard__h3">
          Capacity
        </Text>
      </TextContent>
      <FormGroup
        fieldId="storage-class-dropdown"
        label="Storage Class"
        labelIcon={<FieldLevelHelp>{storageClassTooltip}</FieldLevelHelp>}
      >
        <Grid hasGutter>
          <GridItem span={5}>
            <StorageClassDropdown
              id="storage-class-dropdown"
              onChange={handleStorageClass}
              filter={filterSCWithNoProv}
              noSelection
              hideClassName="ocs-install-wizard__storage-class-label"
            />
            <PVsAvailableCapacity /* @TODO(refactor): Pv data can be passed directly to this component */
              replica={OCS_DEVICE_SET_REPLICA}
              data-test-id="ceph-ocs-install-pvs-available-capacity"
              storageClass={storageClass}
            />
          </GridItem>
          <GridItem span={7} />
        </Grid>
      </FormGroup>
      <TextContent>
        <Text id="select-nodes" component={TextVariants.h3} className="ocs-install-wizard__h3">
          Selected Nodes
        </Text>
      </TextContent>
      <Grid>
        <GridItem span={11}>
          <SelectNodesText text="Selected nodes are based on the selected storage class. The selected nodes will preferably be in 3 different zones with a recommended requirement of 14 CPUs and 34 GiB per node." />
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
            validations.map((validation) =>
              validation.actionLinkStep ? (
                <ActionValidationMessage validation={validation} />
              ) : (
                <ValidationMessage validation={validation} />
              ),
            )}
        </GridItem>
      </Grid>
    </Form>
  );
};

type StorageAndNodesProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
};
