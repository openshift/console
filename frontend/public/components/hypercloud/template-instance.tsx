import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { Status } from '@console/shared';
import { sortable } from '@patternfly/react-table';
import { TemplateInstanceModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { DetailsItem, Kebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, ResourceKebab, Timestamp } from '../utils';

const { common } = Kebab.factory;

const kind = TemplateInstanceModel.kind;

export const templateInstanceMenuActions = [...Kebab.getExtensionsActionsForKind(TemplateInstanceModel), ...common];

const templateInstancePhase = instance => {
  let phase = '';
  if (instance.status) {
    instance.status.conditions.forEach(cur => {
      if (cur.type === '') {
        phase = cur.status;
      }
    });
    return phase;
  }
};

const templateObjectsSummary = templateinstance => {
  // NOTE: template instance가 cluster/namespace 스코프에 따라 objects 정보의 위치가 달라서 분기처리함
  const objects = !!templateinstance.spec?.clustertemplate?.objects ? templateinstance.spec.clustertemplate.objects : !!templateinstance.spec?.template?.objects ? templateinstance.spec.template.objects : [];
  let objMap = new Map();
  for (const i in objects) {
    const kind = !!objects[i].kind ? objects[i].kind : 'unknown kind';
    if (!!objMap.get(kind)) {
      const num = objMap.get(kind) as number;
      objMap.set(kind, num + 1);
    } else {
      objMap.set(kind, 1);
    }
  }
  const objectList = [];
  objMap.forEach((value, key) => {
    objectList.push(
      <div>
        {key} {value}
      </div>,
    );
  });

  return <div>{objectList}</div>;
};

const TemplateInstanceDetails: React.FC<TemplateInstanceDetailsProps> = ({ obj: templateInstance }) => {
  const { t } = useTranslation();
  let phase = templateInstancePhase(templateInstance);
  const objectSummary = templateObjectsSummary(templateInstance);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_21')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={templateInstance} showPodSelector showNodeSelector showOwner={false}></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_13')} obj={templateInstance} path="status.phase">
                <Status status={phase} />
              </DetailsItem>
              <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_104')}</dt>
              <dd>{objectSummary}</dd>
              <DetailsItem label={t('COMMON:MSG_LNB_MENU_17')} obj={templateInstance} path="metadata.labels.serviceInstanceRef">
                {!!templateInstance.metadata.labels?.serviceInstanceRef ? <ResourceLink kind="ServiceInstance" name={templateInstance.metadata.labels?.serviceInstanceRef} title={templateInstance.metadata.labels?.serviceInstanceRef} /> : 'None'}
              </DetailsItem>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

type TemplateInstanceDetailsProps = {
  obj: K8sResourceKind;
};

const { details, editYaml } = navFactory;
const TemplateInstancesDetailsPage: React.FC<TemplateInstancesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={templateInstanceMenuActions} pages={[details(TemplateInstanceDetails), editYaml()]} />;
TemplateInstancesDetailsPage.displayName = 'TemplateInstancesDetailsPage';

const tableColumnClasses = [
  '', // NAME
  '', // NAMESPACE
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-16-on-lg'), // STATUS
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // RESOURCE SUMMARY
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // SERVICE INSTANCE
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // CREATED
  Kebab.columnClass, // MENU ACTIONS
];

const TemplateInstanceTableRow = ({ obj, index, key, style }) => {
  let phase = templateInstancePhase(obj);
  const objectSummary = templateObjectsSummary(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={phase} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{objectSummary}</TableData>
      <TableData className={tableColumnClasses[4]}>{!!obj.metadata.labels?.serviceInstanceRef ? <ResourceLink kind="ServiceInstance" name={obj.metadata.labels?.serviceInstanceRef} namespace={obj.metadata.namespace} title={obj.metadata.labels?.serviceInstanceRef} /> : 'None'}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={templateInstanceMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const TemplateInstanceTableHeader = (t?: TFunction) => {
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
      title: t('COMMON:MSG_MAIN_TABLEHEADER_3'),
      sortFunc: 'templateInstancePhase',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_104'),
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_LNB_MENU_17'),
      sortField: 'metadata.labels.serviceInstanceRef',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};

TemplateInstanceTableHeader.displayName = 'TemplateInstanceTableHeader';

const TemplateInstancesList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Template Instance" Header={TemplateInstanceTableHeader.bind(null, t)} Row={TemplateInstanceTableRow} />;
};
TemplateInstancesList.displayName = 'TemplateInstancesList';

const TemplateInstancesPage: React.FC<TemplateInstancesPageProps> = props => {
  const { t } = useTranslation();
  return (
    <ListPage
      title={t('COMMON:MSG_LNB_MENU_21')}
      createButtonText={t('COMMON:MSG_MAIN_CREATEBUTTON_1', { 0: t('COMMON:MSG_LNB_MENU_21') })}
      canCreate={true}
      kind={kind}
      ListComponent={TemplateInstancesList}
      rowFilters={[
        {
          filterGroupName: 'Status',
          type: 'template-instance-status',
          reducer: templateInstancePhase,
          items: [
            { id: 'Success', title: t('COMMON:MSG_COMMON_FILTER_5') },
            { id: 'Failed', title: t('COMMON:MSG_COMMON_FILTER_6') },
          ],
        },
      ]}
      {...props}
    />
  );
};
TemplateInstancesPage.displayName = 'TemplateInstancesPage';

export { TemplateInstancesList, TemplateInstancesPage, TemplateInstancesDetailsPage };

type TemplateInstancesPageProps = {};

type TemplateInstancesDetailsPageProps = {
  match: any;
};
