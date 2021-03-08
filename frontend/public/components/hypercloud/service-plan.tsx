import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { useState } from 'react';
import { Button } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { ServicePlanModel } from '../../models';
// import { K8sResourceKind, modelFor, k8sGet } from '../../module/k8s';
import { K8sResourceKind, modelFor } from '../../module/k8s';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { navFactory, SectionHeading, ResourceSummary, ResourceLink, Timestamp } from '../utils';
import { ResourceSidebar } from '../sidebars/resource-sidebar';
const kind = ServicePlanModel.kind;

const ServicePlanDetails: React.FC<ServicePlanDetailsProps> = ({ obj: servicePlan }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_13')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={servicePlan} showPodSelector showNodeSelector></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_16')}</dt>
              <dd>{servicePlan.spec.bindable ? 'True' : 'False'}</dd>
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_17')}</dt>
              <dd>{servicePlan.spec.externalName}</dd>
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_18')}</dt>
              <dd>{servicePlan.spec.serviceBrokerName}</dd>
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_19')}</dt>
              <dd>{servicePlan.spec.serviceClassRef.name}</dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type ServicePlanDetailsProps = {
  obj: K8sResourceKind;
};

const { details } = navFactory;
const ServicePlansDetailsPage: React.FC<ServicePlansDetailsPageProps> = props => <DetailsPage {...props} kind={kind} pages={[details(ServicePlanDetails)]} />;
ServicePlansDetailsPage.displayName = 'ServicePlansDetailsPage';

const tableColumnClasses = [
  '', // NAME
  '', // NAMESPACE
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), // BINDABLE
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CREATED
];

const ServicePlanTableHeader = (t?: TFunction) => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_5'),
      sortField: 'spec.bindable',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[6] },
    },
  ];
};
ServicePlanTableHeader.displayName = 'ServicePlanTableHeader';

const ServicePlanTableRow = (setSidebarDetails, setShowSidebar, setSidebarTitle, props) => {
  const { obj, index, key, style } = props;
  const SidebarLink = ({ name, kind, obj }) => {
    return (
      <Button
        type="button"
        variant="link"
        isInline
        onClick={() => {
          setShowSidebar(true);
          setSidebarDetails(obj);
          setSidebarTitle(obj.metadata.name);
        }}
      >
        {name}
      </Button>
    );
  };
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <SidebarLink kind={kind} name={obj.metadata.name} obj={obj} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{obj.spec.bindable ? 'True' : 'False'}</TableData>
      <TableData className={tableColumnClasses[6]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
    </TableRow>
  );
};
const ServicePlansList: React.FC<ServicePlansListProps> = props => {
  const { t } = useTranslation();
  const { setSidebarDetails, setShowSidebar, setSidebarTitle } = props;
  return <Table {...props} aria-label="Service Plan" Header={ServicePlanTableHeader.bind(null, t)} Row={ServicePlanTableRow.bind(null, setSidebarDetails, setShowSidebar, setSidebarTitle)} />;
};
ServicePlansList.displayName = 'ServicePlansList';

const ServicePlansPage: React.FC<ServicePlansPageProps> = props => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [servicePlan, setSidebarDetails] = useState({});
  const [sidebarTitle, setSidebarTitle] = useState('');
  return (
    <>
      <div className="co-p-has-sidebar">
        <div className="co-m-pane__body">
          <ListPage canCreate={false} kind={kind} ListComponent={ServicePlansList} setSidebarTitle={setSidebarTitle} setShowSidebar={setShowSidebar} setSidebarDetails={setSidebarDetails} {...props} />
        </div>
        <ResourceSidebar
          resource={servicePlan}
          kindObj={modelFor('ServicePlan')}
          toggleSidebar={() => {
            setShowSidebar(!showSidebar);
            window.dispatchEvent(new Event('sidebar_toggle'));
          }}
          title={sidebarTitle}
          isFloat={true}
          showName={false}
          showID={true}
          showPodSelector={true}
          showNodeSelector={true}
          showOwner={false}
          showSidebar={showSidebar}
          samples={[]}
          isCreateMode={true}
          showDetails={true}
        />
      </div>
    </>
  );
};
ServicePlansPage.displayName = 'ServicePlansPage';

export { ServicePlansList, ServicePlansPage, ServicePlansDetailsPage };

type ServicePlansListProps = {
  setShowSidebar: any;
  setSidebarDetails: any;
  setSidebarTitle: any;
};
type ServicePlansPageProps = {};

type ServicePlansDetailsPageProps = {
  match: any;
};
