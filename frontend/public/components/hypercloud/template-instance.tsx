import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { Status } from '@console/shared';
import { sortable } from '@patternfly/react-table';
import { TemplateInstanceModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
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
  let phase = templateInstancePhase(templateInstance);
  const objectSummary = templateObjectsSummary(templateInstance);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Template Instance Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={templateInstance} showPodSelector showNodeSelector showOwner={false}></ResourceSummary>
          </div>
          <div className="col-md-6">
            <dl className="co-m-pane__details">
              <DetailsItem label="Status" obj={templateInstance} path="status.phase">
                <Status status={phase} />
              </DetailsItem>
              <dt>Resource Summary</dt>
              <dd>{objectSummary}</dd>
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
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={templateInstanceMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const TemplateInstanceTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Status',
      sortFunc: 'templateInstancePhase',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Resource Summary',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

TemplateInstanceTableHeader.displayName = 'TemplateInstanceTableHeader';

const TemplateInstancesList: React.FC = props => <Table {...props} aria-label="Template Instance" Header={TemplateInstanceTableHeader} Row={TemplateInstanceTableRow} />;
TemplateInstancesList.displayName = 'TemplateInstancesList';

const filters = [
  {
    filterGroupName: 'Status',
    type: 'template-instance-status',
    reducer: templateInstancePhase,
    items: [
      { id: 'Success', title: 'Success' },
      { id: 'Failed', title: 'Failed' },
    ],
  },
];

const TemplateInstancesPage: React.FC<TemplateInstancesPageProps> = props => {
  return <ListPage canCreate={true} kind={kind} ListComponent={TemplateInstancesList} rowFilters={filters} {...props} />;
};
TemplateInstancesPage.displayName = 'TemplateInstancesPage';

export { TemplateInstancesList, TemplateInstancesPage, TemplateInstancesDetailsPage };

type TemplateInstancesPageProps = {};

type TemplateInstancesDetailsPageProps = {
  match: any;
};
