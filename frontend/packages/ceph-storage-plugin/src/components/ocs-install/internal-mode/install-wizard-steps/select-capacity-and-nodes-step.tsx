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
import { StorageClassResourceKind, NodeKind } from '@console/internal/module/k8s';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { ListPage } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { getName, getUID } from '@console/shared';
import { storageClassTooltip, requestedCapacityTooltip } from '../../../../constants';
import { OSDSizeDropdown, TotalCapacityText } from '../../../../utils/osd-size-dropdown';
import { InternalClusterState, InternalClusterAction, ActionType } from '../reducer';
import {
  getNodeInfo,
  shouldDeployAsMinimal,
  filterSCWithoutNoProv,
} from '../../../../utils/install';
import {
  ValidationMessage,
  VALIDATIONS,
  Validation,
} from '../../../../utils/common-ocs-install-el';
import InternalNodeTable from '../../node-list';
import { SelectNodesText, SelectNodesDetails } from '../../install-wizard/capacity-and-nodes';

const validate = (scName, enableMinimal): Validation[] => {
  const validations = [];
  if (enableMinimal) {
    validations.push(VALIDATIONS.MINIMAL);
  }
  if (!scName) {
    validations.push(VALIDATIONS.INTERNALSTORAGECLASS);
  }
  return validations;
};

export const SelectCapacityAndNodes: React.FC<SelectCapacityAndNodesProps> = ({
  state,
  dispatch,
}) => {
  const { nodes: selectedNodes, capacity: selectedCapacity, storageClass, enableMinimal } = state;
  const { cpu, memory, zones } = getNodeInfo(selectedNodes);
  const scName: string = getName(storageClass);
  const nodesCount = selectedNodes.length;
  const validations = validate(scName, enableMinimal);

  React.useEffect(() => {
    const isMinimal = shouldDeployAsMinimal(cpu, memory, nodesCount);
    dispatch({ type: ActionType.SET_ENABLE_MINIMAL, payload: isMinimal });
  }, [cpu, dispatch, memory, nodesCount]);

  return (
    <Form>
      <TextContent>
        <Text component={TextVariants.h3} className="ocs-install-wizard__h3">
          Select Capacity
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
              onChange={(sc: StorageClassResourceKind) =>
                dispatch({ type: ActionType.SET_STORAGE_CLASS, payload: sc })
              }
              noSelection
              filter={filterSCWithoutNoProv}
              hideClassName="ocs-install-wizard__storage-class-label"
            />
          </GridItem>
          <GridItem span={7} />
        </Grid>
      </FormGroup>
      <FormGroup
        fieldId="requested-capacity-dropdown"
        label="Requested Capacity"
        labelIcon={<FieldLevelHelp>{requestedCapacityTooltip}</FieldLevelHelp>}
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
          Select Nodes
        </Text>
      </TextContent>
      <Grid>
        <GridItem span={11}>
          <SelectNodesText text="Select at least 3 nodes, preferably in 3 different zones. It is recommended to start with at least 14 CPUs and 34 GiB per node." />
        </GridItem>
        <GridItem span={10} className="ocs-install-wizard__select-nodes">
          <ListPage
            kind={NodeModel.kind}
            showTitle={false}
            ListComponent={InternalNodeTable}
            nameFilterPlaceholder="Search by node name..."
            labelFilterPlaceholder="Search by node label..."
            customData={{
              onRowSelected: (nodes: NodeKind[]) =>
                dispatch({ type: ActionType.SET_NODES, payload: nodes }),
              nodes: new Set(state.nodes.map(getUID)),
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
