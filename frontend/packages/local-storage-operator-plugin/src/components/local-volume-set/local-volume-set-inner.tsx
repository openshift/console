import * as React from 'react';
import {
  FormGroup,
  TextInput,
  Radio,
  ExpandableSection,
  TextInputTypes,
  Text,
  TextVariants,
  pluralize,
} from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import { ListPage } from '@console/internal/components/factory';
import { NodeKind } from '@console/internal/module/k8s';
import { getName } from '@console/shared';
import { NodeModel } from '@console/internal/models';
import { NodesSelectionList } from './nodes-selection-list';
import { State, Action } from './state';
import {
  diskModeDropdownItems,
  diskTypeDropdownItems,
  diskSizeUnitOptions,
  allNodesSelectorTxt,
} from '../../constants';
import './create-local-volume-set.scss';

export const LocalVolumeSetInner: React.FC<LocalVolumeSetInnerProps> = ({
  dispatch,
  state,
  diskTypeOptions = diskTypeDropdownItems,
  diskModeOptions = diskModeDropdownItems,
  allNodesHelpTxt = allNodesSelectorTxt,
}) => {
  React.useEffect(() => {
    if (!state.showNodesListOnLVS) {
      // explicitly needs to set this in order to make the validation works
      dispatch({ type: 'setNodeNames', value: [] });
      dispatch({ type: 'setNodeNamesForLVS', value: state.nodeNamesForLVS });
    } else {
      dispatch({ type: 'setNodeNames', value: state.nodeNames });
    }
    // TODO: Neha- Find out a better way
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, state.nodeNamesForLVS, state.showNodesListOnLVS]);

  const toggleShowNodesList = () => {
    dispatch({ type: 'setShowNodesListOnLVS', value: !state.showNodesListOnLVS });
  };

  const onMaxSizeChange = (size: string) => {
    if (size && (Number.isNaN(Number(size)) || Number(size) < Number(state.minDiskSize))) {
      dispatch({ type: 'setIsValidMaxSize', value: false });
    } else {
      dispatch({ type: 'setIsValidMaxSize', value: true });
    }
    dispatch({ type: 'setMaxDiskSize', value: size });
  };

  return (
    <>
      <FormGroup label="Volume Set Name" isRequired fieldId="create-lvs-volume-set-name">
        <TextInput
          type={TextInputTypes.text}
          id="create-lvs-volume-set-name"
          value={state.volumeSetName}
          onChange={(name: string) => dispatch({ type: 'setVolumeSetName', name })}
          isRequired
        />
      </FormGroup>
      <FormGroup label="Storage Class Name" fieldId="create-lvs-storage-class-name">
        <TextInput
          type={TextInputTypes.text}
          id="create-lvs-storage-class-name"
          value={state.storageClassName}
          placeholder={state.volumeSetName}
          onChange={(name: string) => dispatch({ type: 'setStorageClassName', name })}
        />
      </FormGroup>
      <Text component={TextVariants.h3} className="lso-create-lvs__filter-volumes-text--margin">
        Filter Disks
      </Text>
      <FormGroup label="Node Selector" fieldId="create-lvs-radio-group-node-selector">
        <div id="create-lvs-radio-group-node-selector">
          <Radio
            label={`All nodes (${pluralize(state.nodeNamesForLVS.length, 'node')})`}
            name="nodes-selection"
            id="create-lvs-radio-all-nodes"
            className="lso-create-lvs__all-nodes-radio--padding"
            value="allNodes"
            onChange={toggleShowNodesList}
            description={allNodesHelpTxt}
            checked={!state.showNodesListOnLVS}
          />
          <Radio
            label="Select nodes"
            name="nodes-selection"
            id="create-lvs-radio-select-nodes"
            value="selectedNodes"
            onChange={toggleShowNodesList}
            description="Selecting all nodes will use the available disks that match the selected filters only on selected nodes."
            checked={state.showNodesListOnLVS}
          />
        </div>
      </FormGroup>
      {state.showNodesListOnLVS && (
        <ListPage
          showTitle={false}
          kind={NodeModel.kind}
          ListComponent={NodesSelectionList}
          customData={{
            onRowSelected: (selectedNodes: NodeKind[]) => {
              const nodes = selectedNodes.map(getName);
              dispatch({ type: 'setNodeNames', value: nodes });
            },
            filteredNodes: state.nodeNamesForLVS,
            preSelected: state.nodeNames,
          }}
        />
      )}
      <FormGroup label="Disk Type" fieldId="create-lvs-disk-type-dropdown">
        <Dropdown
          id="create-lvs-disk-type-dropdown"
          dropDownClassName="dropdown--full-width"
          items={diskTypeOptions}
          title={state.diskType}
          selectedKey={state.diskType}
          onChange={(type: string) =>
            dispatch({ type: 'setDiskType', value: diskTypeDropdownItems[type] })
          }
        />
      </FormGroup>
      <ExpandableSection toggleText="Advanced" data-test-id="create-lvs-form-advanced">
        <FormGroup
          label="Disk Mode"
          fieldId="create-lso-disk-mode-dropdown"
          className="lso-create-lvs__disk-mode-dropdown--margin"
        >
          <Dropdown
            id="create-lso-disk-mode-dropdown"
            dropDownClassName="dropdown--full-width"
            items={diskModeOptions}
            title={state.diskMode}
            selectedKey={state.diskMode}
            onChange={(mode: string) => {
              dispatch({ type: 'setDiskMode', value: diskModeDropdownItems[mode] });
            }}
          />
        </FormGroup>
        <FormGroup
          label="Disk Size"
          fieldId="create-lvs-disk-size"
          className="lso-create-lvs__disk-size-form-group--margin"
        >
          <div id="create-lvs-disk-size" className="lso-create-lvs__disk-size-form-group-div">
            <FormGroup
              label="Min"
              fieldId="create-lvs-min-disk-size"
              className="lso-create-lvs__disk-size-form-group-max-min-input"
            >
              <TextInput
                type={TextInputTypes.number}
                id="create-lvs-min-disk-size"
                value={state.minDiskSize}
                onChange={(size: string) => {
                  dispatch({ type: 'setMinDiskSize', value: size });
                }}
              />
            </FormGroup>
            <div>-</div>
            <FormGroup
              label="Max"
              fieldId="create-lvs-max-disk-size"
              className="lso-create-lvs__disk-size-form-group-max-min-input"
            >
              <TextInput
                type={TextInputTypes.text}
                id="create-lvs-max-disk-size"
                value={state.maxDiskSize}
                validated={state.isValidMaxSize ? 'default' : 'error'}
                className="lso-create-lvs__disk-size-form-group-max-input"
                onChange={onMaxSizeChange}
              />
            </FormGroup>
            <Dropdown
              id="create-lvs-disk-size-unit-dropdown"
              items={diskSizeUnitOptions}
              title={state.diskSizeUnit}
              selectedKey={state.diskSizeUnit}
              onChange={(unit: string) => {
                dispatch({ type: 'setDiskSizeUnit', value: unit });
              }}
            />
          </div>
        </FormGroup>
        <FormGroup label="Max Disk Limit" fieldId="create-lvs-max-disk-limit">
          <p className="help-block lso-create-lvs__max-disk-limit-help-text--margin">
            Disk limit will set the maximum number of PVs to create on a node. If the field is
            empty, will create PVs for all available disks on the matching nodes.
          </p>
          <TextInput
            type={TextInputTypes.number}
            id="create-lvs-max-disk-limit"
            value={state.maxDiskLimit}
            onChange={(maxLimit) => dispatch({ type: 'setMaxDiskLimit', value: maxLimit })}
            placeholder="All"
          />
        </FormGroup>
      </ExpandableSection>
    </>
  );
};

type LocalVolumeSetInnerProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  diskTypeOptions?: { [key: string]: string };
  diskModeOptions?: { [key: string]: string };
  allNodesHelpTxt?: string;
};

export const LocalVolumeSetHeader = () => (
  <>
    <h1 className="co-create-operand__header-text">Local Volume Set</h1>
    <p className="help-block">
      A Local Volume Set allows you to filter a set of storage volumes, group them and create a
      dedicated storage class to consume storage for them.
    </p>
  </>
);
