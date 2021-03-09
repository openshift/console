import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { ClusterServiceClassModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { navFactory, SectionHeading, ResourceSummary, ResourceLink, Timestamp } from '../utils';
import { ClusterServicePlansPage } from './cluster-service-plan';

const kind = ClusterServiceClassModel.kind;

const ClusterServiceClassDetails: React.FC<ClusterServiceClassDetailsProps> = ({ obj: clusterServiceClass }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_12')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={clusterServiceClass} showPodSelector showNodeSelector></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_16')}</dt>
              <dd>{clusterServiceClass.spec.bindable ? 'True' : 'False'}</dd>
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_17')}</dt>
              <dd>{clusterServiceClass.spec.externalName}</dd>
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_18')}</dt>
              <dd>
                <ResourceLink kind="ClusterServiceBroker" name={clusterServiceClass.spec.clusterServiceBrokerName} title={clusterServiceClass.spec.clusterServiceBrokerName} />
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ClusterServiceClassDetailsProps = {
  obj: K8sResourceKind;
};

const ClusterServicePlanTab: React.FC<ClusterServicePlansTabProps> = ({ obj }) => {
  const serviceClassRef = obj.spec.externalMetadata.serviceClassRefName;

  const selector = {
    matchLabels: {
      'servicecatalog.k8s.io/spec.clusterServiceClassRef.name': serviceClassRef,
    },
  };

  return <ClusterServicePlansPage showTitle={false} canCreate={false} selector={selector} />;
};

const { details, editYaml } = navFactory;
const ClusterServiceClassesDetailsPage: React.FC<ClusterServiceClassesDetailsPageProps> = props => {
  return (
    <DetailsPage
      {...props}
      kind={kind}
      pages={[
        details(ClusterServiceClassDetails),
        editYaml(),
        {
          href: 'clusterserviceplan',
          name: 'Cluster Service Plan',
          component: ClusterServicePlanTab,
        },
      ]}
    />
  );
};
ClusterServiceClassesDetailsPage.displayName = 'ClusterServiceClassesDetailsPage';

const tableColumnClasses = [
  '', // NAME
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), // BINDABLE
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // EXTERNAL NAME
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), // CLUSTER SERVICE BROKER
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CREATED
];

const ClusterServiceClassTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} title={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>{obj.spec.bindable ? 'True' : 'False'}</TableData>
      <TableData className={tableColumnClasses[2]}>{obj.spec.externalName}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceLink kind="ClusterServiceBroker" name={obj.spec.clusterServiceBrokerName} title={obj.spec.clusterServiceBrokerName} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
    </TableRow>
  );
};

const ClusterServiceClassTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_5'),
      sortField: 'spec.bindable',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_6'),
      sortField: 'spec.externalName',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_LNB_MENU_14'),
      sortField: 'spec.clusterServiceBrokerName',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
  ];
};

ClusterServiceClassTableHeader.displayName = 'ClusterServiceClassTableHeader';

const ClusterServiceClassesList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Cluster Service Class" Header={ClusterServiceClassTableHeader.bind(null, t)} Row={ClusterServiceClassTableRow} />;
};
ClusterServiceClassesList.displayName = 'ClusterServiceClassesList';

const ClusterServiceClassesPage: React.FC<ClusterServiceClassesPageProps> = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_15')} createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_15') })} canCreate={true} kind={kind} ListComponent={ClusterServiceClassesList} {...props} />;
};
ClusterServiceClassesPage.displayName = 'ClusterServiceClassesPage';

export { ClusterServiceClassesList, ClusterServiceClassesPage, ClusterServiceClassesDetailsPage };

type ClusterServiceClassesPageProps = {};

type ClusterServiceClassesDetailsPageProps = {
  match: any;
};

type ClusterServicePlansTabProps = {
  obj: K8sResourceKind;
};
