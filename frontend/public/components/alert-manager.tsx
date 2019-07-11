import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { referenceForModel, K8sResourceKind } from '../module/k8s';
import { ListPage, DetailsPage, VirtualTable, VirtualTableRow, VirtualTableData } from './factory';
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
  classNames('col-md-2', 'col-sm-3', 'col-xs-6'),
  classNames('col-md-2', 'col-sm-3', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-3', 'hidden-xs'),
  classNames('col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-3', 'col-sm-3', 'hidden-xs'),
];

const AlertManagerTableRow: React.FC<AlertManagerTableRowProps> = ({obj: alertManager, index, key, style}) => {
  const {metadata, spec} = alertManager;
  return (
    <VirtualTableRow id={alertManager.metadata.uid} index={index} trKey={key} style={style}>
      <VirtualTableData className={tableColumnClasses[0]}>
        <ResourceLink kind={referenceForModel(AlertmanagerModel)} name={metadata.name} namespace={metadata.namespace} title={metadata.uid} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[1]}>
        <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[2]}>
        <LabelList kind={AlertmanagerModel.kind} labels={metadata.labels} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[3]}>
        {spec.version}
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[4]}>
        <Selector selector={spec.nodeSelector} kind="Node" />
      </VirtualTableData>
    </VirtualTableRow>
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

export const AlertManagersList = props => <VirtualTable {...props} aria-label="Alert Managers" Header={AlertManagerTableHeader} Row={AlertManagerTableRow} />;

export const AlertManagersPage = props => <ListPage {...props} ListComponent={AlertManagersList} canCreate={false} kind={referenceForModel(AlertmanagerModel)} />;

type DetailsProps = {
  obj: K8sResourceKind;
};
