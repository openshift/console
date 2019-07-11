import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Alert } from '@patternfly/react-core';

import { ClusterOperatorModel } from '../../models';
import {
  DetailsPage,
  Table,
  ListPage,
  VirtualTable,
  VirtualTableRow,
  VirtualTableData,
} from '../factory';
import { Conditions } from '../conditions';
import {
  getClusterOperatorStatus,
  getClusterOperatorVersion,
  getClusterVersionCondition,
  getStatusAndMessage,
  ClusterOperator,
  ClusterVersionConditionType,
  ClusterVersionKind,
  K8sResourceConditionStatus,
  K8sResourceKindReference,
  OperandVersion,
  OperatorStatus,
  referenceForModel,
} from '../../module/k8s';
import {
  navFactory,
  EmptyBox,
  Kebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from '../utils';

export const clusterOperatorReference: K8sResourceKindReference = referenceForModel(ClusterOperatorModel);

const getIconClass = (status: OperatorStatus) => {
  return {
    [OperatorStatus.Available]: 'pficon pficon-ok text-success',
    [OperatorStatus.Updating]: 'fa fa-refresh',
    [OperatorStatus.Degraded]: 'pficon pficon-warning-triangle-o text-warning',
    [OperatorStatus.Unknown]: 'pficon pficon-unknown',
  }[status];
};

const OperatorStatusIconAndLabel: React.SFC<OperatorStatusIconAndLabelProps> = ({status}) => {
  const iconClass = getIconClass(status);
  return <React.Fragment><i className={iconClass} aria-hidden="true" /> {status}</React.Fragment>;
};

const tableColumnClasses = [
  classNames('col-md-3', 'col-sm-3', 'col-xs-6'),
  classNames('col-md-2', 'col-sm-3', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-3', 'hidden-xs'),
  classNames('col-md-4', 'col-sm-3', 'hidden-xs'),
  Kebab.columnClass,
];

const ClusterOperatorTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status', sortFunc: 'getClusterOperatorStatus', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Version', sortFunc: 'getClusterOperatorVersion', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Message', props: { className: tableColumnClasses[3] },
    },
  ];
};
ClusterOperatorTableHeader.displayName = 'ClusterOperatorTableHeader';

const ClusterOperatorTableRow: React.FC<ClusterOperatorTableRowProps> = ({obj, index, key, style}) => {
  const { status, message } = getStatusAndMessage(obj);
  const operatorVersion = getClusterOperatorVersion(obj);
  return (
    <VirtualTableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <VirtualTableData className={tableColumnClasses[0]}>
        <ResourceLink kind={clusterOperatorReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[1]}>
        <OperatorStatusIconAndLabel status={status} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[2]}>
        {operatorVersion || '-'}
      </VirtualTableData>
      <VirtualTableData className={classNames(tableColumnClasses[3], 'co-break-word', 'co-pre-line')}>
        {message ? _.truncate(message, { length: 256, separator: ' ' }) : '-'}
      </VirtualTableData>
    </VirtualTableRow>
  );
};
ClusterOperatorTableRow.displayName = 'ClusterOperatorTableRow';
type ClusterOperatorTableRowProps = {
  obj: ClusterOperator;
  index: number;
  key?: string;
  style: object;
};

export const ClusterOperatorList: React.SFC = props => <VirtualTable {...props} aria-label="Cluster Operators" Header={ClusterOperatorTableHeader} Row={ClusterOperatorTableRow} />;

const allStatuses = [
  OperatorStatus.Available,
  OperatorStatus.Updating,
  OperatorStatus.Degraded,
  OperatorStatus.Unknown,
];

const filters = [{
  type: 'cluster-operator-status',
  selected: allStatuses,
  reducer: getClusterOperatorStatus,
  items: _.map(allStatuses, phase => ({
    id: phase,
    title: phase,
  })),
}];

const UpdateInProgressAlert: React.SFC<UpdateInProgressAlertProps> = ({cv}) => {
  const updateCondition = getClusterVersionCondition(cv, ClusterVersionConditionType.Progressing, K8sResourceConditionStatus.True);
  return (
    <React.Fragment>
      { updateCondition &&
        <div className="co-m-pane__body co-m-pane__body--section-heading">
          <Alert isInline className="co-alert" variant="info" title="Cluster update in progress.">
            {updateCondition.message}
          </Alert>
        </div>
      }
    </React.Fragment>
  );
};

export const ClusterOperatorPage: React.SFC<ClusterOperatorPageProps> = props =>
  <React.Fragment>
    <UpdateInProgressAlert cv={props.cv} />
    <ListPage
      {...props}
      title="Cluster Operators"
      kind={clusterOperatorReference}
      ListComponent={ClusterOperatorList}
      canCreate={false}
      rowFilters={filters}
    />
  </React.Fragment>;

const OperandVersions: React.SFC<OperandVersionsProps> = ({versions}) => {
  const OperandVersionsHeader = () => {
    return [
      { title: 'Name' },
      { title: 'Version' },
    ];
  };
  const OperandVersionsRows = ({componentProps}) => {
    return _.map(componentProps.data, ({name, version}) => {
      return [
        { title: name },
        { title: version },
      ];
    });
  };
  return _.isEmpty(versions)
    ? <EmptyBox label="Versions" />
    : <div className="co-table-container">
      <Table
        aria-label="Versions"
        data={versions}
        Header={OperandVersionsHeader}
        Rows={OperandVersionsRows}
        loaded={true} />
    </div>;
};


const ClusterOperatorDetails: React.SFC<ClusterOperatorDetailsProps> = ({obj}) => {
  const { status, message } = getStatusAndMessage(obj);
  const versions: OperandVersion[] = _.get(obj, 'status.versions', []);
  const conditions = _.get(obj, 'status.conditions', []);
  // Show the operator version in the details overview if it's the only version.
  const operatorVersion = versions.length === 1 && versions[0].name === 'operator'
    ? versions[0].version
    : null;
  return (
    <React.Fragment>
      <div className="co-m-pane__body">
        <SectionHeading text="Cluster Operator Overview" />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} />
          </div>
          <div className="col-sm-6">
            <dl>
              {operatorVersion && <React.Fragment>
                <dt>Version</dt>
                <dd>{operatorVersion}</dd>
              </React.Fragment>}
              <dt>Status</dt>
              <dd><OperatorStatusIconAndLabel status={status} /></dd>
              <dt>Message</dt>
              <dd className="co-pre-line">{message || '-'}</dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={conditions} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Operand Versions" />
        <OperandVersions versions={versions} />
      </div>
    </React.Fragment>
  );
};

export const ClusterOperatorDetailsPage: React.SFC<ClusterOperatorDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={clusterOperatorReference}
    pages={[navFactory.details(ClusterOperatorDetails), navFactory.editYaml()]}
  />;

type OperatorStatusIconAndLabelProps = {
  status: OperatorStatus;
};

type ClusterOperatorPageProps = {
  cv: ClusterVersionKind;
  autoFocus?: boolean;
  showTitle?: boolean;
};

type OperandVersionsProps = {
  versions: OperandVersion[];
};

type ClusterOperatorDetailsProps = {
  obj: ClusterOperator;
};

type ClusterOperatorDetailsPageProps = {
  match: any;
};

type UpdateInProgressAlertProps = {
  cv: ClusterVersionKind;
};
