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
import { StorageClassResourceKind, NodeKind } from '@console/internal/module/k8s';
import { StorageClassDropdown } from '@console/internal/components/utils/storage-class-dropdown';
import { ListPage } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { getName, getUID, useFlag } from '@console/shared';
import { GUARDED_FEATURES } from '@console/ceph-storage-plugin/src/features';
import { storageClassTooltip, requestedCapacityTooltip } from '../../../../constants';
import { OSDSizeDropdown, TotalCapacityText } from '../../../../utils/osd-size-dropdown';
import { InternalClusterState, InternalClusterAction, ActionType } from '../reducer';
import {
  getNodeInfo,
  shouldDeployAsMinimal,
  filterSCWithoutNoProv,
} from '../../../../utils/install';
import { ValidationMessage, ValidationType } from '../../../../utils/common-ocs-install-el';
import InternalNodeTable from '../../node-list';
import {
  SelectNodesText,
  SelectNodesDetails,
  EnableTaintNodes,
} from '../../install-wizard/capacity-and-nodes';

const validate = (scName, enableMinimal): ValidationType[] => {
  const validations = [];

  if (enableMinimal) {
    validations.push(ValidationType.MINIMAL);
  }
  if (!scName) {
    validations.push(ValidationType.INTERNALSTORAGECLASS);
  }
  return validations;
};

export const SelectCapacityAndNodes: React.FC<SelectCapacityAndNodesProps> = ({
  state,
  dispatch,
  mode,
}) => {
  const { t } = useTranslation();
  const { nodes: selectedNodes, capacity: selectedCapacity, storageClass, enableMinimal } = state;

  const { cpu, memory, zones } = getNodeInfo(selectedNodes);
  const scName: string = getName(storageClass);
  const nodesCount = selectedNodes.length;
  const validations = validate(scName, enableMinimal);
  const isTaintSupported = useFlag(GUARDED_FEATURES.OCS_TAINT_NODES);

  React.useEffect(() => {
    const isMinimal = shouldDeployAsMinimal(cpu, memory, nodesCount);
    dispatch({ type: ActionType.SET_ENABLE_MINIMAL, payload: isMinimal });
  }, [cpu, dispatch, memory, nodesCount]);

  return (
    <Form>
      <TextContent>
        <Text component={TextVariants.h3} className="ocs-install-wizard__h3">
          {t('ceph-storage-plugin~Select Capacity')}
        </Text>
      </TextContent>
      <FormGroup
        fieldId="storage-class-dropdown"
        label={t('ceph-storage-plugin~StorageClass')}
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
              data-test="storage-class-dropdown"
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
            text={t(
              'ceph-storage-plugin~Select at least 3 nodes preferably in 3 different zones. It is recommended to start with at least 14 CPUs and 34 GiB per node.',
            )}
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
            }}
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

type SelectCapacityAndNodesProps = {
  state: InternalClusterState;
  dispatch: React.Dispatch<InternalClusterAction>;
  mode: string;
};
