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
import { ListPage } from '@console/internal/components/factory';
import { Dropdown } from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import { NodeKind } from '@console/internal/module/k8s';
import { getName, MultiSelectDropdown } from '@console/shared';
import {
  deviceTypeDropdownItems,
  diskSizeUnitOptions,
  diskTypeDropdownItems,
} from '@console/local-storage-operator-plugin/src/constants';
import { NodesTable } from '@console/local-storage-operator-plugin/src/components/tables/nodes-table';
import { diskModeDropdownItems, NO_PROVISIONER } from '../../../../constants';
import { LocalVolumeSet, WizardDispatch, WizardState } from '../../reducer';

import './body.scss';

export const LocalVolumeSetBody: React.FC<LocalVolumeSetBodyProps> = ({
  dispatch,
  state,
  storageClassName,
  taintsFilter,
  diskModeOptions = diskModeDropdownItems,
  allNodesHelpTxt,
  lvsNameHelpTxt,
  deviceTypeOptions = deviceTypeDropdownItems,
}) => {
  const { t } = useTranslation();
  const formHandler = React.useCallback(
    (field: keyof LocalVolumeSet, value: LocalVolumeSet[keyof LocalVolumeSet]) =>
      dispatch({ type: 'wizard/setCreateLocalVolumeSet', payload: { field, value } }),
    [dispatch],
  );

  const diskDropdownOptions = diskTypeDropdownItems(t);

  const INTEGER_MAX_REGEX = /^\+?([1-9]\d*)$/;
  const INTEGER_MIN_REGEX = /^\+?([0-9]\d*)$/;
  const [activeMinDiskSize, setMinActiveState] = React.useState(false);
  const [activeMaxDiskSize, setMaxActiveState] = React.useState(false);
  const validMinDiskSize = INTEGER_MIN_REGEX.test(state.minDiskSize || '1');
  const validMaxDiskSize = INTEGER_MAX_REGEX.test(state.maxDiskSize || '1');
  const validMaxDiskLimit = INTEGER_MAX_REGEX.test(state.maxDiskLimit || '1');
  const invalidMinGreaterThanMax =
    state.minDiskSize !== '' &&
    state.maxDiskSize !== '' &&
    Number(state.minDiskSize) > Number(state.maxDiskSize);

  const toggleShowNodesList = () => formHandler('lvsIsSelectNodes', !state.lvsIsSelectNodes);

  React.useEffect(() => {
    if (!validMinDiskSize || !validMaxDiskSize || !validMaxDiskLimit || invalidMinGreaterThanMax) {
      formHandler('isValidDiskSize', false);
    } else {
      formHandler('isValidDiskSize', true);
    }
  }, [
    dispatch,
    validMinDiskSize,
    validMaxDiskSize,
    validMaxDiskLimit,
    invalidMinGreaterThanMax,
    formHandler,
  ]);

  return (
    <>
      <FormGroup
        label={t('ceph-storage-plugin~LocalVolumeSet Name')}
        isRequired
        fieldId="create-lvs-volume-set-name"
      >
        <TextInput
          type={TextInputTypes.text}
          id="create-lvs-volume-set-name"
          value={state.volumeSetName}
          onChange={(name: string) => formHandler('volumeSetName', name)}
          isRequired
        />
        {lvsNameHelpTxt ? <p className="help-block">{lvsNameHelpTxt}</p> : null}
      </FormGroup>
      <FormGroup
        label={t('ceph-storage-plugin~StorageClass Name')}
        fieldId="create-lvs-storage-class-name"
      >
        <TextInput
          type={TextInputTypes.text}
          id="create-lvs-storage-class-name"
          value={storageClassName}
          placeholder={state.volumeSetName}
          onChange={(name: string) =>
            dispatch({
              type: 'wizard/setStorageClass',
              payload: { name, provisioner: NO_PROVISIONER },
            })
          }
        />
      </FormGroup>
      <Text component={TextVariants.h3} className="odf-create-lvs__filter-volumes-text--margin">
        {t('ceph-storage-plugin~Filter Disks By')}
      </Text>
      <FormGroup fieldId="create-lvs-radio-group-node-selector">
        <div id="create-lvs-radio-group-node-selector">
          <Radio
            label={
              <>
                {t('ceph-storage-plugin~Disks on all nodes')}
                {' ('}
                {t('ceph-storage-plugin~{{nodes, number}} node', {
                  nodes: state.lvsAllNodes.length,
                  count: state.lvsAllNodes.length,
                })}
                {')'}
              </>
            }
            name="nodes-selection"
            id="create-lvs-radio-all-nodes"
            className="odf-create-lvs__all-nodes-radio--padding"
            value="allNodes"
            onChange={toggleShowNodesList}
            description={allNodesHelpTxt}
            checked={!state.lvsIsSelectNodes}
          />
          <Radio
            label={t('ceph-storage-plugin~Disks on selected nodes')}
            name="nodes-selection"
            id="create-lvs-radio-select-nodes"
            value="selectedNodes"
            onChange={toggleShowNodesList}
            description={t(
              'ceph-storage-plugin~Uses the available disks that match the selected filters only on selected nodes.',
            )}
            checked={state.lvsIsSelectNodes}
          />
        </div>
      </FormGroup>
      {state.lvsIsSelectNodes && (
        <div className="odf-lvd-body__select-nodes">
          <ListPage
            showTitle={false}
            kind={NodeModel.kind}
            ListComponent={NodesTable}
            customData={{
              onRowSelected: (selectedNodes: NodeKind[]) =>
                formHandler('lvsSelectNodes', selectedNodes),
              filteredNodes: state.lvsAllNodes.map(getName),
              preSelectedNodes: state.lvsSelectNodes.map(getName),
              hasOnSelect: true,
              taintsFilter,
            }}
          />
        </div>
      )}
      <FormGroup label={t('ceph-storage-plugin~Disk Type')} fieldId="create-lvs-disk-type-dropdown">
        <Dropdown
          id="create-lvs-disk-type-dropdown"
          dropDownClassName="dropdown--full-width"
          items={diskDropdownOptions}
          title={diskDropdownOptions[state.diskType]}
          selectedKey={state.diskType}
          onChange={(type: string) => formHandler('diskType', type)}
        />
      </FormGroup>
      <ExpandableSection
        toggleText={t('ceph-storage-plugin~Advanced')}
        data-test-id="create-lvs-form-advanced"
      >
        <FormGroup
          label={t('ceph-storage-plugin~Volume Mode')}
          fieldId="create-odf-disk-mode-dropdown"
          className="odf-create-lvs__disk-mode-dropdown--margin"
        >
          <Dropdown
            id="create-odf-disk-mode-dropdown"
            dropDownClassName="dropdown--full-width"
            items={diskModeOptions}
            title={state.diskMode}
            selectedKey={state.diskMode}
            onChange={(mode: string) => formHandler('diskMode', mode)}
          />
        </FormGroup>
        <FormGroup
          label="Device Type"
          fieldId="create-odf-device-type-dropdown"
          className="odf-create-lvs__device-type-dropdown--margin"
        >
          <MultiSelectDropdown
            id="create-odf-device-type-dropdown"
            options={[deviceTypeOptions.DISK, deviceTypeOptions.PART]}
            placeholder="Select disk types"
            onChange={(selectedValues: string[]) => formHandler('deviceType', selectedValues)}
            defaultSelected={[deviceTypeOptions.DISK, deviceTypeOptions.PART]}
          />
        </FormGroup>
        <FormGroup
          label={t('ceph-storage-plugin~Disk Size')}
          fieldId="create-lvs-disk-size"
          className="odf-create-lvs__disk-size-form-group--margin"
        >
          <div id="create-lvs-disk-size" className="odf-create-lvs__disk-size-form-group-div">
            <FormGroup
              label={t('ceph-storage-plugin~Min')}
              fieldId="create-lvs-min-disk-size"
              className="odf-create-lvs__disk-size-form-group-max-min-input"
            >
              <Tooltip
                content={
                  !validMinDiskSize
                    ? 'Please enter a positive Integer'
                    : 'Please enter a value less than or equal to max disk size'
                }
                isVisible={!validMinDiskSize || (invalidMinGreaterThanMax && activeMinDiskSize)}
                trigger="manual"
              >
                <TextInput
                  type={TextInputTypes.text}
                  id="create-lvs-min-disk-size"
                  value={state.minDiskSize}
                  validated={
                    !validMinDiskSize || (invalidMinGreaterThanMax && activeMinDiskSize)
                      ? 'error'
                      : 'default'
                  }
                  className="odf-create-lvs__disk-input"
                  onFocus={() => setMinActiveState(true)}
                  onBlur={() => setMinActiveState(false)}
                  onChange={(size: string) => formHandler('minDiskSize', size)}
                />
              </Tooltip>
            </FormGroup>
            <div>-</div>
            <FormGroup
              label={t('ceph-storage-plugin~Max')}
              fieldId="create-lvs-max-disk-size"
              className="odf-create-lvs__disk-size-form-group-max-min-input"
            >
              <Tooltip
                content={
                  !validMaxDiskSize
                    ? 'Please enter a positive Integer'
                    : 'Please enter a value greater than or equal to min disk size'
                }
                isVisible={!validMaxDiskSize || (invalidMinGreaterThanMax && activeMaxDiskSize)}
                trigger="manual"
              >
                <TextInput
                  type={TextInputTypes.text}
                  id="create-lvs-max-disk-size"
                  value={state.maxDiskSize}
                  validated={
                    !validMaxDiskSize || (invalidMinGreaterThanMax && activeMaxDiskSize)
                      ? 'error'
                      : 'default'
                  }
                  className="odf-create-lvs__disk-input"
                  onFocus={() => setMaxActiveState(true)}
                  onBlur={() => setMaxActiveState(false)}
                  onChange={(value) => formHandler('maxDiskSize', value)}
                />
              </Tooltip>
            </FormGroup>
            <Dropdown
              id="create-lvs-disk-size-unit-dropdown"
              items={diskSizeUnitOptions}
              title={diskSizeUnitOptions[state.diskSizeUnit]}
              selectedKey={state.diskSizeUnit}
              onChange={(unit: string) => formHandler('diskSizeUnit', unit)}
            />
          </div>
        </FormGroup>
        <FormGroup
          label={t('ceph-storage-plugin~Maximum Disks Limit')}
          fieldId="create-lvs-max-disk-limit"
        >
          <p className="help-block odf-create-lvs__max-disk-limit-help-text--margin">
            {t(
              'ceph-storage-plugin~Disks limit will set the maximum number of PVs to create on a node. If the field is empty we will create PVs for all available disks on the matching nodes.',
            )}
          </p>
          <Tooltip
            content="Please enter a positive Integer"
            isVisible={!validMaxDiskLimit}
            trigger="manual"
          >
            <TextInput
              type={TextInputTypes.text}
              id="create-lvs-max-disk-limit"
              value={state.maxDiskLimit}
              validated={validMaxDiskLimit ? 'default' : 'error'}
              className="odf-create-lvs__disk-input"
              onChange={(maxLimit) => formHandler('maxDiskLimit', maxLimit)}
              placeholder={t('ceph-storage-plugin~All')}
            />
          </Tooltip>
        </FormGroup>
      </ExpandableSection>
    </>
  );
};

type LocalVolumeSetBodyProps = {
  state: WizardState['createLocalVolumeSet'];
  dispatch: WizardDispatch;
  storageClassName: string;
  diskModeOptions?: { [key: string]: string };
  deviceTypeOptions?: { [key: string]: string };
  allNodesHelpTxt?: string;
  lvsNameHelpTxt?: string;
  taintsFilter?: (node: NodeKind) => boolean;
};
