import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { referenceForModel, K8sResourceKind } from '../module/k8s';
import { ListPage, DetailsPage, Table, TableRow, TableData } from './factory';
import { SectionHeading, LabelList, navFactory, ResourceLink, Selector, Firehose, LoadingInline, pluralize } from './utils';
import { configureReplicaCountModal } from './modals';
import { AlertmanagerModel } from '../models';

const Details: React.SFC<DetailsProps> = (props) => {
  const alertManager = props.obj;
  const {metadata, spec} = alertManager;

  const openReplicaCountModal = (event) => {
    event.preventDefault();
    event.target.blur();
    configureReplicaCountModal({resourceKind: AlertmanagerModel, resource: alertManager});
  };

  return <div>
    <div className="co-m-pane__body">
      <SectionHeading text="Alert Manager Overview" />
      <div className="row">
        <div className="col-sm-6 col-xs-12">
          <dl className="co-m-pane__details">
            <dt>Name</dt>
            <dd>{metadata.name}</dd>
            <dt>Labels</dt>
            <dd><LabelList kind="Alertmanager" labels={metadata.labels} /></dd>
            {spec.nodeSelector && <dt>Alert Manager Node Selector</dt>}
            {spec.nodeSelector && <dd><Selector selector={spec.nodeSelector} kind="Node" /></dd>}
          </dl>
        </div>
        <div className="col-sm-6 col-xs-12">
          <dl className="co-m-pane__details">
            <dt>Version</dt>
            <dd>{spec.version}</dd>
            <dt>Replicas</dt>
            <dd>
              <button type="button" className="btn btn-link co-modal-btn-link co-modal-btn-link--left" onClick={openReplicaCountModal}>{pluralize(spec.replicas, 'pod')}</button>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>;
};

const {details, editYaml} = navFactory;

export const AlertManagersDetailsPage = props => <DetailsPage
  {...props}
  pages={[
    details(Details),
    editYaml(),
  ]}
/>;

const AlertManagersNameList = (props) => {
  if (props.loadError) {
    return null;
  }
  return <div className="row co-m-form-row">
    <div className="col-sm-8 col-md-9">
      <div className="alert-manager-list">
        {!props.loaded
          ? <LoadingInline />
          : _.map(props.alertmanagers.data, (alertManager, i) => <div className="alert-manager-row" key={i}>
            <ResourceLink kind={referenceForModel(AlertmanagerModel)} name={alertManager.metadata.name} namespace={alertManager.metadata.namespace} title={alertManager.metadata.uid} />
          </div>)}
      </div>
    </div>
  </div>;
};

export const AlertManagersListContainer = props => <Firehose resources={[{
  kind: referenceForModel(AlertmanagerModel),
  isList: true,
  namespaced: true,
  namespace: 'tectonic-system',
  prop: 'alertmanagers',
}]}>
  <AlertManagersNameList {...props} />
</Firehose>;

const tableColumnClasses = [
  classNames('pf-m-2-col-on-lg', 'pf-m-3-col-on-md', 'pf-m-6-col-on-sm'),
  classNames('pf-m-2-col-on-lg', 'pf-m-3-col-on-md', 'pf-m-6-col-on-sm'),
  classNames('pf-m-3-col-on-lg', 'pf-m-3-col-on-md', 'pf-m-hidden', 'pf-m-visible-on-md'),
  classNames('pf-m-2-col-on-lg', 'pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-3-col-on-lg', 'pf-m-3-col-on-md', 'pf-m-hidden', 'pf-m-visible-on-md'),
];

const AlertManagerTableRow: React.FC<AlertManagerTableRowProps> = ({obj: alertManager, index, key, style}) => {
  const {metadata, spec} = alertManager;
  return (
    <TableRow id={alertManager.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={referenceForModel(AlertmanagerModel)} name={metadata.name} namespace={metadata.namespace} title={metadata.uid} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={AlertmanagerModel.kind} labels={metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {spec.version}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={spec.nodeSelector} kind="Node" />
      </TableData>
    </TableRow>
  );
};
AlertManagerTableRow.displayName = 'AlertManagerTableRow';
type AlertManagerTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
};

const AlertManagerTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', sortField: 'metadata.namespace', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Labels', sortField: 'metadata.labels', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Version', sortField: 'spec.version', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Node Selector', sortField: 'spec.nodeSelector', transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
  ];
};
AlertManagerTableHeader.displayName = 'AlertManagerTableHeader';

export const AlertManagersList = props => <Table {...props} aria-label="Alert Managers" Header={AlertManagerTableHeader} Row={AlertManagerTableRow} virtualize />;

export const AlertManagersPage = props => <ListPage {...props} ListComponent={AlertManagersList} canCreate={false} kind={referenceForModel(AlertmanagerModel)} />;

type DetailsProps = {
  obj: K8sResourceKind;
};
