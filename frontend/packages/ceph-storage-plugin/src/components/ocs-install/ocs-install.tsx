import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { match } from 'react-router';
import { safeDump } from 'js-yaml';
import { sortable } from '@patternfly/react-table';
import { Alert } from '@patternfly/react-core';

import { ButtonBar } from '@console/internal/components/utils/button-bar';
import { history } from '@console/internal/components/utils/router';
import { RadioInput } from '@console/internal/components/radio';
import {
  referenceForModel,
  getNodeRoles,
  K8sResourceKind,
  K8sKind,
  k8sGet,
  k8sCreate,
  K8sResourceKindReference,
  Status,
  k8sList,
} from '@console/internal/module/k8s';
import {
  ResourceLink,
  BreadCrumbs,
  humanizeBinaryBytes,
} from '@console/internal/components/utils/index';
import { Table, TableRow, TableData, ListPage } from '@console/internal/components/factory';
import { ConfigMapModel, NodeModel, ClusterServiceVersionModel } from '@console/internal/models';
import { ClusterServiceVersionKind } from '@console/internal/components/operator-lifecycle-manager/index';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { OCSServiceModel } from '../../models';

import './ocs-install.scss';

const tableColumnClasses = [
  classNames('col-md-1', 'col-sm-1', 'col-xs-1'),
  classNames('col-md-3', 'col-sm-4', 'col-xs-7'),
  classNames('col-md-1', 'col-sm-3', 'hidden-xs'),
  classNames('col-md-1', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-2', 'col-sm-4', 'col-xs-4'),
];

const NodeTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Role',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'CPU',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Memory',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Capacity',
      props: { className: tableColumnClasses[5] },
    },
    {
      title: 'Devices',
      props: { className: tableColumnClasses[6] },
    },
  ];
};
NodeTableHeader.displayName = 'NodeTableHeader';
const configMapsForAllNodes = {};

const getConfigMaps = () => {
  k8sList(ConfigMapModel, {
    ns: 'openshift-storage',
  }).then((configMaps) => {
    configMaps.forEach((config) => {
      const nodeName = config.metadata.labels && config.metadata.labels['rook.io/node'];

      if (typeof nodeName !== 'undefined') {
        try {
          configMapsForAllNodes[nodeName] = JSON.parse(config.data.devices).length;
        } catch (e) {
          // ignore
          // eslint-disable-next-line no-console
          console.warn('Invalid JSON');
          return;
        }
      }
    });
  });
};

const getConvertedUnits = (value, initialUnit, preferredUnit) => {
  return (
    humanizeBinaryBytes(_.slice(value, 0, value.length - 2).join(''), initialUnit, preferredUnit)
      .string || '-'
  );
};

const NodeTableRow: React.FC<NodeTableRowProps> = ({
  obj: node,
  index,
  key,
  style,
  customData,
  onSelect,
}) => {
  const roles = getNodeRoles(node).sort();
  const deviceCount = configMapsForAllNodes[node.metadata.name] || 0;
  const isChecked = customData.length > index ? customData[index].selected : false;

  return (
    <TableRow id={node.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={`pf-c-table__check ${tableColumnClasses[0]}`}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => {
            onSelect(e, e.target.checked, index);
          }}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Node" name={node.metadata.name} title={node.metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{roles.join(', ') || '-'}</TableData>
      <TableData className={tableColumnClasses[3]}>
        {_.get(node.status, 'capacity.cpu') || '-'} CPU
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {getConvertedUnits(_.get(node.status, 'allocatable.memory'), 'KiB', 'GiB')}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {getConvertedUnits(_.get(node.status, 'capacity.memory'), 'KiB', 'GiB')}
      </TableData>
      <TableData className={tableColumnClasses[6]}>{deviceCount} Selected</TableData>
    </TableRow>
  );
};

export const NodeList: React.FC<NodeListProps> = (props) => {
  const [selectedNodeData, setSelectedNodeData] = React.useState(props.customData);

  const onSelect = (event, isSelected, virtualRowIndex, data) => {
    event.preventDefault();
    let newSelectedRowData = _.cloneDeep(selectedNodeData);

    // clone `data` in case previous Firehose updates added elements, preserve existing selection state
    _.each(data, (row, index: number) => {
      if (index < newSelectedRowData.length) {
        // preserve existing selection state
        newSelectedRowData[index] = {
          ...row,
          uid: row.metadata.uid,
          selected: newSelectedRowData[index].selected,
        };
      } else {
        // set initial selection state from storage here if necessary...for now, initialize it false
        newSelectedRowData.push({ ...row, uid: row.metadata.uid, selected: false });
      }
    });

    if (virtualRowIndex !== -1) {
      // set the selection based on virtualRowIndex node, it should exist in the array now
      newSelectedRowData[virtualRowIndex].selected = isSelected;
    } else {
      // selectAll
      newSelectedRowData = _.map(selectedNodeData, (row) => ({ ...row, selected: isSelected }));
    }
    setSelectedNodeData(newSelectedRowData);
    props.onSelect(newSelectedRowData);
  };

  const onSingleSelect = (event, isSelected, virtualRowIndex) => {
    event.preventDefault();
    onSelect(event, isSelected, virtualRowIndex, props.data);
  };

  const onSelectAll = (event, isSelected, virtualRowIndex) => {
    event.preventDefault();
    onSelect(event, isSelected, virtualRowIndex, props.data);
  };

  return (
    <Table
      customData={selectedNodeData}
      {...props}
      Header={NodeTableHeader}
      Row={(nodeProps) => <NodeTableRow {...nodeProps} onSelect={onSingleSelect} />} // this is the correct select callback for single row
      aria-label="Nodes"
      virtualize
      onSelect={onSelectAll} // this is the selectAll callback for virtualized tables
    />
  );
};

export const CreateOCSServiceForm: React.FC<CreateOCSServiceFormProps> = React.memo((props) => {
  const title = 'Create New OCS Service';
  const [error, setError] = React.useState('');
  const [inProgress, setProgress] = React.useState(false);
  const [ipiInstallationMode, setIpiInstallationMode] = React.useState(true);

  // must initialize like this w/ at least one item, current bug in pf-react row.every for selectAll
  // setting a dummy value for now
  const initialSelectionState = [{ selected: false }];
  const [selectedNodeData, setSelectedNodeData] = React.useState(initialSelectionState);

  const onSelect = (selectedRow) => {
    // `newSelectedRowData` can be persisted somewhere after it is passed back up...
    setSelectedNodeData(selectedRow);
  };

  React.useEffect(() => {
    if (!ipiInstallationMode) {
      getConfigMaps();
    }
  }, [ipiInstallationMode]);

  const updateMode = () => {
    const mode = !ipiInstallationMode;
    setIpiInstallationMode(mode);
  };

  const submit = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    event.stopPropagation();

    setProgress(true);
    setError('');

    k8sCreate(OCSServiceModel, props.sample, { ns: 'openshift-storage' })
      .then(() => {
        history.push(
          `/k8s/ns/${props.namespace}/clusterserviceversions/${
            props.clusterServiceVersion.metadata.name
          }/${referenceForModel(OCSServiceModel)}/${props.sample.metadata.name}`,
        );
        setProgress(false);
        setError('');
      })
      .catch((err: Status) => setError(err.message));
  };
  return (
    <div className="ceph-ocs-install__form co-m-pane__body co-m-pane__form">
      <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
        <div className="co-m-pane__name">{title}</div>
      </h1>
      <p className="co-m-pane__explanation">
        OCS runs as a cloud-native service for optimal integration with applications in need of
        storage, and handles the scenes such as provisioning and management.
      </p>
      <form className="co-m-pane__body-group" onSubmit={submit}>
        <fieldset>
          <legend className="co-legend co-required">Deployment Type</legend>
          <div className="row">
            <div className="col-sm-10">
              <RadioInput
                title="Create new nodes"
                name="co-deployment-type"
                id="co-deployment-type__ipi"
                value="ipi"
                onChange={updateMode}
                checked={ipiInstallationMode}
                desc="3 new nodes and an AWS bucket will be created to provide the OCS Service"
              />
            </div>
          </div>
          <div className="row">
            <div className="col-sm-10">
              <RadioInput
                title="Use existing nodes"
                name="co-deployment-type"
                id="co-deployment-type__upi"
                value="upi"
                onChange={updateMode}
                checked={!ipiInstallationMode}
                desc="A minimum of 3 nodes needs to be labeled with role=storage-node in order to create the OCS Service"
              />
            </div>
            <div className="col-sm-2">
              <button type="button" className="btn btn-link" onClick={props.changeToYAMLMethod}>
                Edit YAML
              </button>
            </div>
          </div>
          {!ipiInstallationMode && (
            <div className="co-m-radio-desc">
              <Alert
                className="co-alert ceph-ocs-info__alert"
                variant="info"
                title="An AWS bucket will be created to provide the OCS Service."
              />
              <p className="co-legend co-required ceph-ocs-desc__legend">
                Select at least 3 nodes you wish to use.
              </p>
            </div>
          )}
          {!ipiInstallationMode && (
            <ListPage
              kind={NodeModel.kind}
              showTitle={false}
              ListComponent={(nodeProps) => (
                <NodeList
                  {...nodeProps}
                  data={nodeProps.data}
                  customData={selectedNodeData}
                  onSelect={onSelect}
                />
              )}
            />
          )}
        </fieldset>
        <ButtonBar errorMessage={error} inProgress={inProgress}>
          <button type="submit" className="btn btn-primary" id="save-changes">
            Create
          </button>
          <button type="button" className="btn btn-default" onClick={history.goBack}>
            Cancel
          </button>
        </ButtonBar>
      </form>
    </div>
  );
});

export const CreateOCSServiceYAML: React.FC<CreateOCSServiceYAMLProps> = (props) => {
  const template = _.attempt(() => safeDump(props.sample));
  if (_.isError(template)) {
    // eslint-disable-next-line no-console
    console.error('Error parsing example JSON from annotation. Falling back to default.');
  }

  return (
    <CreateYAML
      template={!_.isError(template) ? template : null}
      match={props.match}
      hideHeader={false}
    />
  );
};

/**
 * Component which wraps the YAML editor and form together
 */
export const CreateOCSService: React.FC<CreateOCSServiceProps> = (props) => {
  const [sample, setSample] = React.useState(null);
  const [method, setMethod] = React.useState<'yaml' | 'form'>('form');
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);

  React.useEffect(() => {
    k8sGet(ClusterServiceVersionModel, props.match.params.appName, props.match.params.ns).then(
      (clusterServiceVersionObj) => {
        try {
          setSample(
            JSON.parse(_.get(clusterServiceVersionObj.metadata.annotations, 'alm-examples'))[0],
          );
          setClusterServiceVersion(clusterServiceVersionObj);
        } catch (e) {
          setClusterServiceVersion(null);
          return;
        }
      },
    );
  }, [props.match.params.appName, props.match.params.ns]);

  const changeToYAMLMethod = (event) => {
    event.preventDefault();
    setMethod('yaml');
  };
  return (
    <React.Fragment>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
          {clusterServiceVersion !== null && (
            <BreadCrumbs
              breadcrumbs={[
                {
                  name: clusterServiceVersion.spec.displayName,
                  path: window.location.pathname.replace('/~new', ''),
                },
                { name: `Create ${OCSServiceModel.label}`, path: window.location.pathname },
              ]}
            />
          )}
        </div>
      </div>
      {(method === 'form' && (
        <CreateOCSServiceForm
          namespace={props.match.params.ns}
          operandModel={OCSServiceModel}
          sample={sample}
          clusterServiceVersion={clusterServiceVersion !== null && clusterServiceVersion.metadata}
          changeToYAMLMethod={changeToYAMLMethod}
        />
      )) ||
        (method === 'yaml' && <CreateOCSServiceYAML match={props.match} sample={sample} />)}
    </React.Fragment>
  );
};

type CreateOCSServiceProps = {
  match: match<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  operandModel: K8sKind;
  sample?: K8sResourceKind;
  namespace: string;
  loadError?: any;
  clusterServiceVersion: ClusterServiceVersionKind;
};

type CreateOCSServiceFormProps = {
  operandModel: K8sKind;
  sample?: K8sResourceKind;
  namespace: string;
  clusterServiceVersion: ClusterServiceVersionKind;
  changeToYAMLMethod: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

type CreateOCSServiceYAMLProps = {
  sample?: K8sResourceKind;
  match: match<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
};

type NodeTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
  customData?: any;
  onSelect?: Function;
};

type NodeListProps = {
  customData?: any;
  onSelect?: Function;
  data: Record<string, any>[];
};
