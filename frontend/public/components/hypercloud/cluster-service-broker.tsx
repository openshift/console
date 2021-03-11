import * as React from 'react';
import * as _ from 'lodash-es';
import { Status } from '@console/shared';
import { sortable } from '@patternfly/react-table';
import { ClusterServiceBrokerModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { DetailsItem, Kebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, ResourceKebab, Timestamp } from '../utils';
import { ResourceLabel } from '../../models/hypercloud/resource-plural';

const { common } = Kebab.factory;
const kind = ClusterServiceBrokerModel.kind;

export const clusterServiceBrokerMenuActions = [...Kebab.getExtensionsActionsForKind(ClusterServiceBrokerModel), ...common];
const ClusterServiceBrokerDetails: React.FC<ClusterServiceBrokerDetailsProps> = ({ obj: clusterServiceBroker }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', {0: ResourceLabel(clusterServiceBroker, t)})} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={clusterServiceBroker} showPodSelector showNodeSelector></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_13')} obj={clusterServiceBroker} path="status.phase">
                <Status status={ClusterServiceBrokerPhase(clusterServiceBroker)} />
              </DetailsItem>
              <dt>URL</dt>
              <dd>{clusterServiceBroker.spec.url}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ClusterServiceBrokerDetailsProps = {
  obj: K8sResourceKind;
};

const { details, editYaml } = navFactory;
const ClusterServiceBrokersDetailsPage: React.FC<ClusterServiceBrokersDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={clusterServiceBrokerMenuActions} pages={[details(ClusterServiceBrokerDetails), editYaml()]} />;
ClusterServiceBrokersDetailsPage.displayName = 'ClusterServiceBrokersDetailsPage';

const tableColumnClasses = ['', '', '', '', ''];

const ClusterServiceBrokerPhase = instance => {
  let phase = '';
  if (instance.status) {
    instance.status.conditions.forEach(cur => {
      if (cur.type === 'Ready') {
        if (cur.status === 'True') {
          phase = 'Running';
        } else {
          phase = 'Error';
        }
      }
    });
    return phase;
  }
};

const ClusterServiceBrokerTableRow = ({ obj, index, key, style }) => {
  let phase = ClusterServiceBrokerPhase(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} title={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{obj.spec.url}</TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={phase} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={clusterServiceBrokerMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ClusterServiceBrokerTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_4'),
      sortField: 'spec.url',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortFunc: 'ServiceBrokerPhase',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};
ClusterServiceBrokerTableHeader.displayName = 'ClusterServiceBrokerTableHeader';

const ClusterServiceBrokersList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Cluster Service Broker" Header={ClusterServiceBrokerTableHeader.bind(null, t)} Row={ClusterServiceBrokerTableRow} virtualize />;
};
ClusterServiceBrokersList.displayName = 'ClusterServiceBrokersList';

const ClusterServiceBrokersPage: React.FC<ClusterServiceBrokersPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_14')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_14') })} canCreate={true} kind={kind} ListComponent={ClusterServiceBrokersList} {...props} />;
};
ClusterServiceBrokersPage.displayName = 'ClusterServiceBrokersPage';

export { ClusterServiceBrokersList, ClusterServiceBrokersPage, ClusterServiceBrokersDetailsPage };

type ClusterServiceBrokersPageProps = {};

type ClusterServiceBrokersDetailsPageProps = {
  match: any;
};
