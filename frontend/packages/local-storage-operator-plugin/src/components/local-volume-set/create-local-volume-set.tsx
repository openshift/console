import * as React from 'react';
import { match as RouterMatch } from 'react-router';
import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  TextInput,
  Radio,
  ExpandableSection,
  TextInputTypes,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import {
  resourcePathFromModel,
  BreadCrumbs,
  Dropdown,
  resourceObjPath,
  withHandlePromise,
  HandlePromiseProps,
  ButtonBar,
} from '@console/internal/components/utils';
import { history } from '@console/internal/components/utils/router';
import { ListPage } from '@console/internal/components/factory';
import { k8sCreate, referenceFor } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager';
import { LocalVolumeSetModel } from '../../models';
import { NodesSelectionList } from './nodes-selection-list';
import {
  RowUIDMap,
  LocalVolumeSetKind,
  DeviceType,
  DiskType,
  DeviceMechanicalProperty,
} from './types';
import { getSelectedNodeUIDs } from './utils';
import './create-local-volume-set.scss';

const volumeModeDropdownItems = {
  Block: 'Block',
  Filesystem: 'Filesystem',
};

const volumeTypeDropdownItems = {
  [DiskType.SSD]: 'SSD / NVMe',
  [DiskType.HDD]: 'HDD',
};

const CreateLocalVolumeSet: React.FC = withHandlePromise<CreateLocalVolumeSetProps>((props) => {
  const { match, handlePromise, inProgress, errorMessage } = props;
  const [volumeSetName, setVolumeSetName] = React.useState('');
  const [storageClassName, setStorageClassName] = React.useState('');
  const [showNodesList, setShowNodesList] = React.useState(false);
  const [volumeType, setVolumeType] = React.useState<DiskType>(DiskType.SSD);
  const [volumeMode, setVolumeMode] = React.useState(volumeModeDropdownItems.Block);
  const [maxVolumeLimit, setMaxVolumeLimit] = React.useState('');
  const [rows, setRows] = React.useState<RowUIDMap>({});
  const [allSelected, setAllSelected] = React.useState<boolean>(null);

  const { ns, appName } = match.params;
  const modelName = LocalVolumeSetModel.label;

  const toggleShowNodesList = () => {
    setShowNodesList(!showNodesList);
  };

  const onSubmit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();

    const requestData: LocalVolumeSetKind = {
      apiVersion: LocalVolumeSetModel.apiVersion,
      kind: LocalVolumeSetModel.kind,
      metadata: { name: volumeSetName },
      spec: {
        storageClassName,
        volumeMode,
        deviceInclusionSpec: {
          // Only Raw disk supported for 4.5
          deviceTypes: [DeviceType.RawDisk],
          deviceMechanicalProperty: [DeviceMechanicalProperty[volumeType]],
        },
      },
    };

    if (showNodesList) {
      const selectedNodesUID = getSelectedNodeUIDs(rows);
      const selectedNodes = selectedNodesUID.map((uid) => rows[uid].props.data.metadata.name);
      requestData.spec.nodeSelector = {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              { key: 'kubernetes.io/hostname', operator: 'In', values: [...selectedNodes] },
            ],
          },
        ],
      };
    }
    if (maxVolumeLimit) requestData.spec.maxDeviceCount = +maxVolumeLimit;

    handlePromise(k8sCreate(LocalVolumeSetModel, requestData))
      .then((resource) => history.push(resourceObjPath(resource, referenceFor(resource))))
      .catch(() => null);
  };

  return (
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
          <BreadCrumbs
            breadcrumbs={[
              {
                name: 'Local Storage',
                path: resourcePathFromModel(ClusterServiceVersionModel, appName, ns),
              },
              { name: `Create ${modelName}`, path: '' },
            ]}
          />
        </div>
        <h1 className="co-create-operand__header-text">{`Create ${modelName}`}</h1>
        <p className="help-block">
          A {modelName} allows you to filter a set of storage volumes, group them and create a
          dedicated storage class to consume storage for them.
        </p>
      </div>
      <Form noValidate={false} className="co-m-pane__body co-m-pane__form" onSubmit={onSubmit}>
        <FormGroup label="Volume Set Name" isRequired fieldId="create-lvs--volume-set-name">
          <TextInput
            type={TextInputTypes.text}
            id="create-lvs--volume-set-name"
            value={volumeSetName}
            onChange={(name) => setVolumeSetName(name)}
            isRequired
          />
        </FormGroup>
        <FormGroup label="Storage Class Name" fieldId="create-lvs--storage-class-name">
          <TextInput
            type={TextInputTypes.text}
            id="create-lvs--storage-class-name"
            value={storageClassName}
            onChange={(name) => setStorageClassName(name)}
            isRequired
          />
        </FormGroup>
        <Text component={TextVariants.h3} className="lso-create-lvs__filter-volumes-text--margin">
          Filter Volumes
        </Text>
        <FormGroup label="Node Selector" fieldId="create-lvs--radio-group-node-selector">
          <div id="create-lvs--radio-group-node-selector">
            <Radio
              label="All nodes"
              name="nodes-selection"
              id="create-lvs--radio-all-nodes"
              className="lso-create-lvs__all-nodes-radio--padding"
              value="allNodes"
              onChange={toggleShowNodesList}
              description="Selecting all nodes will search for available volume storage on all nodes."
              defaultChecked
            />
            <Radio
              label="Select nodes"
              name="nodes-selection"
              id="create-lvs--radio-select-nodes"
              value="selectedNodes"
              onChange={toggleShowNodesList}
              description="Selecting nodes allow you to limit the search for available volumes to specific nodes."
            />
          </div>
        </FormGroup>
        {showNodesList && (
          <ListPage
            customData={{ rows, setRows, allSelected, setAllSelected }}
            showTitle={false}
            kind={NodeModel.kind}
            ListComponent={NodesSelectionList}
          />
        )}
        <FormGroup label="Volume Type" fieldId="create-lvs--volume-type-dropdown">
          <Dropdown
            id="create-lvs--volume-type-dropdown"
            dropDownClassName="dropdown--full-width"
            items={volumeTypeDropdownItems}
            title={volumeTypeDropdownItems[volumeType]}
            selectedKey={volumeType}
            onChange={(type: DiskType) => setVolumeType(type)}
          />
        </FormGroup>
        <ExpandableSection toggleText="Advanced" data-test-id="create-lvs-form-advanced">
          <FormGroup
            label="Volume Mode"
            fieldId="create-lso--volume-mode-dropdown"
            className="lso-create-lvs__volume-mode-dropdown--margin"
          >
            <Dropdown
              id="create-lso--volume-mode-dropdown"
              dropDownClassName="dropdown--full-width"
              items={volumeModeDropdownItems}
              title={volumeModeDropdownItems[volumeMode]}
              selectedKey={volumeMode}
              onChange={(mode: string) => setVolumeMode(mode)}
            />
          </FormGroup>
          <FormGroup label="Max Volume Limit" fieldId="create-lvs--max-volume-limit">
            <p className="help-block lso-create-lvs__max-volume-limit-help-text--margin">
              Volume limit will set the maximum number of PVs to create on a node. If the field is
              empty, will create PVs for all available volumes on the matching nodes.
            </p>
            <TextInput
              type={TextInputTypes.number}
              id="create-lvs--max-volume-limit"
              value={maxVolumeLimit}
              onChange={(maxLimit) => setMaxVolumeLimit(maxLimit)}
            />
          </FormGroup>
        </ExpandableSection>
        <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
          <ActionGroup>
            <Button type="submit" variant="primary">
              Create
            </Button>
            <Button type="button" variant="secondary" onClick={history.goBack}>
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </Form>
    </>
  );
});

type CreateLocalVolumeSetProps = {
  match: RouterMatch<{ appName: string; ns: string }>;
} & HandlePromiseProps;

export default CreateLocalVolumeSet;
