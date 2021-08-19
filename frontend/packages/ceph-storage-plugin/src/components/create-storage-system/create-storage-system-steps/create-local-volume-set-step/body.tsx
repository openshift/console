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
import { NodeKind } from '@console/internal/module/k8s';
import { MultiSelectDropdown } from '@console/shared';
import {
  deviceTypeDropdownItems,
  diskModeDropdownItems,
  diskSizeUnitOptions,
  diskTypeDropdownItems,
} from '@console/local-storage-operator-plugin/src/constants';
import { LocalVolumeSet, WizardDispatch, WizardState } from '../../reducer';
import './body.scss';
import { createWizardNodeState } from '../../../../utils/create-storage-system';
import { SelectNodesTable } from '../../select-nodes-table/select-nodes-table';
import { NO_PROVISIONER } from '../../../../constants/common';

export enum FilterDiskBy {
  ALL_NODES = 'all-nodes',
  SELECTED_NODES = 'selected-nodes',
}

const AllNodesLabel: React.FC<{ count: number }> = ({ count }) => {
  const { t } = useTranslation();
  return (
    <>
      {t('ceph-storage-plugin~Disks on all nodes')}
      {' ('}
      {t('ceph-storage-plugin~{{nodes, number}} node', {
        nodes: count,
        count,
      })}
      {')'}
    </>
  );
};

export const LocalVolumeSetBody: React.FC<LocalVolumeSetBodyProps> = ({
  dispatch,
  state,
  storageClassName,
  nodes,
  allNodes,
}) => {
  const { t } = useTranslation();
  const [radio, setRadio] = React.useState(FilterDiskBy.ALL_NODES);
  const [activeMinDiskSize, setMinActiveState] = React.useState(false);
  const [activeMaxDiskSize, setMaxActiveState] = React.useState(false);

  React.useEffect(() => {
    // Update the nodes with allNodes when the component is rendered
    dispatch({ type: 'wizard/nodes', payload: allNodes });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formHandler = React.useCallback(
    (field: keyof LocalVolumeSet, value: LocalVolumeSet[keyof LocalVolumeSet]) =>
      dispatch({ type: 'wizard/setCreateLocalVolumeSet', payload: { field, value } }),
    [dispatch],
  );

  const INTEGER_MAX_REGEX = /^\+?([1-9]\d*)$/;
  const INTEGER_MIN_REGEX = /^\+?([0-9]\d*)$/;

  const validMinDiskSize = INTEGER_MIN_REGEX.test(state.minDiskSize || '1');
  const validMaxDiskSize = INTEGER_MAX_REGEX.test(state.maxDiskSize || '1');
  const validMaxDiskLimit = INTEGER_MAX_REGEX.test(state.maxDiskLimit || '1');

  const invalidMinGreaterThanMax =
    state.minDiskSize !== '' &&
    state.maxDiskSize !== '' &&
    Number(state.minDiskSize) > Number(state.maxDiskSize);

  React.useEffect(() => {
    if (!validMinDiskSize || !validMaxDiskSize || !validMaxDiskLimit || invalidMinGreaterThanMax) {
      formHandler('isValidDiskSize', false);
    } else {
      formHandler('isValidDiskSize', true);
    }
  }, [
    formHandler,
    state.minDiskSize,
    state.maxDiskSize,
    state.maxDiskLimit,
    validMinDiskSize,
    validMaxDiskSize,
    validMaxDiskLimit,
    invalidMinGreaterThanMax,
  ]);

  const diskSizeHelpText = t('ceph-storage-plugin~Please enter a positive Integer');
  const diskDropdownOptions = diskTypeDropdownItems(t);

  const onRowSelected = React.useCallback(
    (selectedNodes: NodeKind[]) => {
      const nodesData = createWizardNodeState(selectedNodes);
      dispatch({ type: 'wizard/nodes', payload: nodesData });
    },
    [dispatch],
  );

  const RADIO_GROUP_NAME = 'filter-by-nodes-radio-group';

  const onRadioSelect = (_, event) => {
    const { value } = event.target || { value: '' };
    value === FilterDiskBy.ALL_NODES
      ? dispatch({ type: 'wizard/nodes', payload: allNodes })
      : dispatch({ type: 'wizard/nodes', payload: [] });
    setRadio(value);
  };

  return (
    <>
      <FormGroup
        label={t('ceph-storage-plugin~LocalVolumeSet Name')}
        isRequired
        fieldId="create-lvs-volume-set-name"
        helperText={t(
          'ceph-storage-plugin~A LocalVolumeSet allows you to filter a set of disks, group them and create a dedicated StorageClass to consume storage from them.',
        )}
      >
        <TextInput
          type={TextInputTypes.text}
          id="create-lvs-volume-set-name"
          value={state.volumeSetName}
          onChange={(name: string) => formHandler('volumeSetName', name)}
          isRequired
        />
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
      <Radio
        label={<AllNodesLabel count={allNodes?.length} />}
        description={t(
          'ceph-storage-plugin~Uses the available disks that match the selected filters on all nodes.',
        )}
        name={RADIO_GROUP_NAME}
        value={FilterDiskBy.ALL_NODES}
        isChecked={radio === FilterDiskBy.ALL_NODES}
        onChange={onRadioSelect}
        id="create-lvs-radio-all-nodes"
        className="odf-create-lvs__all-nodes-radio--padding"
      />
      <Radio
        label={t('ceph-storage-plugin~Disks on selected nodes')}
        description={t(
          'ceph-storage-plugin~Uses the available disks that match the selected filters only on selected nodes.',
        )}
        name={RADIO_GROUP_NAME}
        value={FilterDiskBy.SELECTED_NODES}
        isChecked={radio === FilterDiskBy.SELECTED_NODES}
        onChange={onRadioSelect}
        id="create-lvs-radio-select-nodes"
      />
      {radio === FilterDiskBy.SELECTED_NODES && (
        <SelectNodesTable nodes={nodes} onRowSelected={onRowSelected} />
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
            items={diskModeDropdownItems}
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
            options={[deviceTypeDropdownItems.DISK, deviceTypeDropdownItems.PART]}
            placeholder={t('ceph-storage-plugin~Select disk types')}
            onChange={(selectedValues: string[]) => formHandler('deviceType', selectedValues)}
            defaultSelected={[deviceTypeDropdownItems.DISK, deviceTypeDropdownItems.PART]}
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
                    ? diskSizeHelpText
                    : t(
                        'ceph-storage-plugin~Please enter a value less than or equal to max disk size',
                      )
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
                    ? diskSizeHelpText
                    : t(
                        'ceph-storage-plugin~Please enter a value greater than or equal to min disk size',
                      )
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
          <Tooltip content={diskSizeHelpText} isVisible={!validMaxDiskLimit} trigger="manual">
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
  nodes: WizardState['nodes'];
  allNodes: WizardState['nodes'];
};
