import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FormGroup,
  TextInput,
  Radio,
  ExpandableSection,
  TextInputTypes,
  Text,
  TextVariants,
  Tooltip,
} from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import { ListPage } from '@console/internal/components/factory';
import { NodeKind } from '@console/internal/module/k8s';
import { getName, MultiSelectDropdown } from '@console/shared';
import { NodeModel } from '@console/internal/models';
import { NodesSelectionList } from './nodes-selection-list';
import { State, Action } from './state';
import {
  diskModeDropdownItems,
  diskTypeDropdownItems,
  diskSizeUnitOptions,
  deviceTypeDropdownItems,
} from '../../constants';
import './create-local-volume-set.scss';

export const LocalVolumeSetInner: React.FC<LocalVolumeSetInnerProps> = ({
  dispatch,
  state,
  taintsFilter,
  diskModeOptions = diskModeDropdownItems,
  allNodesHelpTxt,
  deviceTypeOptions = deviceTypeDropdownItems,
}) => {
  const { t } = useTranslation();

  const diskDropdownOptions = diskTypeDropdownItems(t);

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

  const validMaxDiskSize = /^\+?([1-9]\d*)$/.test(state.maxDiskSize || '1');
  const validMaxDiskLimit = /^\+?([1-9]\d*)$/.test(state.maxDiskLimit || '1');

  return (
    <>
      <FormGroup
        label={t('lso-plugin~Volume Set Name')}
        isRequired
        fieldId="create-lvs-volume-set-name"
      >
        <TextInput
          type={TextInputTypes.text}
          id="create-lvs-volume-set-name"
          value={state.volumeSetName}
          onChange={(name: string) => dispatch({ type: 'setVolumeSetName', name })}
          isRequired
        />
      </FormGroup>
      <FormGroup label={t('lso-plugin~Storage Class Name')} fieldId="create-lvs-storage-class-name">
        <TextInput
          type={TextInputTypes.text}
          id="create-lvs-storage-class-name"
          value={state.storageClassName}
          placeholder={state.volumeSetName}
          onChange={(name: string) => dispatch({ type: 'setStorageClassName', name })}
        />
      </FormGroup>
      <Text component={TextVariants.h3} className="lso-create-lvs__filter-volumes-text--margin">
        {t('lso-plugin~Filter Disks')}
      </Text>
      <FormGroup
        label={t('lso-plugin~Node Selector')}
        fieldId="create-lvs-radio-group-node-selector"
      >
        <div id="create-lvs-radio-group-node-selector">
          <Radio
            label={
              <>
                {t('lso-plugin~All nodes')}
                {'('}
                {t('lso-plugin~{{nodes, number}} node', {
                  nodes: state.nodeNamesForLVS.length,
                  count: state.nodeNamesForLVS.length,
                })}
                {')'}
              </>
            }
            name="nodes-selection"
            id="create-lvs-radio-all-nodes"
            className="lso-create-lvs__all-nodes-radio--padding"
            value="allNodes"
            onChange={toggleShowNodesList}
            description={allNodesHelpTxt}
            checked={!state.showNodesListOnLVS}
          />
          <Radio
            label={t('lso-plugin~Select nodes')}
            name="nodes-selection"
            id="create-lvs-radio-select-nodes"
            value="selectedNodes"
            onChange={toggleShowNodesList}
            description={t(
              'lso-plugin~Selecting all nodes will use the available disks that match the selected filters only on selected nodes.',
            )}
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
            taintsFilter,
          }}
        />
      )}
      <FormGroup label={t('lso-plugin~Disk Type')} fieldId="create-lvs-disk-type-dropdown">
        <Dropdown
          id="create-lvs-disk-type-dropdown"
          dropDownClassName="dropdown--full-width"
          items={diskDropdownOptions}
          title={diskDropdownOptions[state.diskType]}
          selectedKey={state.diskType}
          onChange={(type: string) => dispatch({ type: 'setDiskType', value: type })}
        />
      </FormGroup>
      <ExpandableSection
        toggleText={t('lso-plugin~Advanced')}
        data-test-id="create-lvs-form-advanced"
      >
        <FormGroup
          label={t('lso-plugin~Disk Mode')}
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
          label="Device Type"
          fieldId="create-lso-device-type-dropdown"
          className="lso-create-lvs__device-type-dropdown--margin"
        >
          <MultiSelectDropdown
            id="create-lso-device-type-dropdown"
            options={[deviceTypeOptions.DISK, deviceTypeOptions.PART]}
            placeholder="Select disk types"
            onChange={(selectedValues: string[]) => {
              dispatch({ type: 'setDeviceType', value: selectedValues });
            }}
            defaultSelected={[deviceTypeOptions.DISK, deviceTypeOptions.PART]}
          />
        </FormGroup>
        <FormGroup
          label={t('lso-plugin~Disk Size')}
          fieldId="create-lvs-disk-size"
          className="lso-create-lvs__disk-size-form-group--margin"
        >
          <div id="create-lvs-disk-size" className="lso-create-lvs__disk-size-form-group-div">
            <FormGroup
              label={t('lso-plugin~Min')}
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
              label={t('lso-plugin~Max')}
              fieldId="create-lvs-max-disk-size"
              className="lso-create-lvs__disk-size-form-group-max-min-input"
            >
              <Tooltip
                content="Please enter a positive Integer"
                isVisible={!validMaxDiskSize}
                trigger="manual"
              >
                <TextInput
                  type={TextInputTypes.number}
                  id="create-lvs-max-disk-size"
                  value={state.maxDiskSize}
                  validated={validMaxDiskSize ? 'default' : 'error'}
                  className="lso-create-lvs__disk-size-form-group-max-input"
                  onChange={(value) => dispatch({ type: 'setMaxDiskSize', value })}
                />
              </Tooltip>
            </FormGroup>
            <Dropdown
              id="create-lvs-disk-size-unit-dropdown"
              items={diskSizeUnitOptions}
              title={diskSizeUnitOptions[state.diskSizeUnit]}
              selectedKey={state.diskSizeUnit}
              onChange={(unit: string) => {
                dispatch({ type: 'setDiskSizeUnit', value: unit });
              }}
            />
          </div>
        </FormGroup>
        <FormGroup label={t('lso-plugin~Max Disk Limit')} fieldId="create-lvs-max-disk-limit">
          <p className="help-block lso-create-lvs__max-disk-limit-help-text--margin">
            {t(
              'lso-plugin~Disk limit will set the maximum number of PVs to create on a node. If the field is empty will create PVs for all available disks on the matching nodes.',
            )}
          </p>
          <Tooltip
            content="Please enter a positive Integer"
            isVisible={!validMaxDiskLimit}
            trigger="manual"
          >
            <TextInput
              type={TextInputTypes.number}
              id="create-lvs-max-disk-limit"
              value={state.maxDiskLimit}
              validated={validMaxDiskLimit ? 'default' : 'error'}
              onChange={(maxLimit) => dispatch({ type: 'setMaxDiskLimit', value: maxLimit })}
              placeholder={t('lso-plugin~All')}
            />
          </Tooltip>
        </FormGroup>
      </ExpandableSection>
    </>
  );
};

type LocalVolumeSetInnerProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  diskModeOptions?: { [key: string]: string };
  deviceTypeOptions?: { [key: string]: string };
  allNodesHelpTxt?: string;
  taintsFilter?: (node: NodeKind) => boolean;
};

export const LocalVolumeSetHeader = () => {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="co-create-operand__header-text">{t('lso-plugin~Local Volume Set')}</h1>
      <p className="help-block">
        {t(
          'lso-plugin~A Local Volume Set allows you to filter a set of storage volumes group them and create a dedicated storage class to consume storage for them.',
        )}
      </p>
    </>
  );
};
