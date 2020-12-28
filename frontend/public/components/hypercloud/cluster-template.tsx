import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import { ClusterTemplateModel } from '../../models';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableData, TableRow } from '../factory';
import { ResourceKebab, Kebab, navFactory, SectionHeading, ResourceSummary, ResourceLink, Timestamp } from '../utils';

const { common } = Kebab.factory;
const kind = ClusterTemplateModel.kind;

export const clusterTemplateMenuActions = [...Kebab.getExtensionsActionsForKind(ClusterTemplateModel), ...common];

const ClusterTemplateDetails: React.FC<ClusterTemplateDetailsProps> = ({ obj: clusterTemplate }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Cluster Template Details" />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={clusterTemplate} showPodSelector showNodeSelector></ResourceSummary>
          </div>
        </div>
      </div>
    </>
  );
};

type ClusterTemplateDetailsProps = {
  obj: K8sResourceKind;
};

const { details, editYaml } = navFactory;
const ClusterTemplatesDetailsPage: React.FC<ClusterTemplatesDetailsPageProps> = props => <DetailsPage {...props} kind={kind} menuActions={clusterTemplateMenuActions} pages={[details(ClusterTemplateDetails), editYaml()]} />;
ClusterTemplatesDetailsPage.displayName = 'ClusterTemplatesDetailsPage';

const tableColumnClasses = [
  '', // NAME
  '', // CREATED
  Kebab.columnClass, // MENU ACTIONS
];

const ClusterTemplateTableRow = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} title={obj.metadata.name} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <ResourceKebab actions={clusterTemplateMenuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const ClusterTemplateTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[2] },
    },
  ];
};

ClusterTemplateTableHeader.displayName = 'ClusterTemplateTableHeader';

const ClusterTemplatesList: React.FC = props => <Table {...props} aria-label="Cluster Template" Header={ClusterTemplateTableHeader} Row={ClusterTemplateTableRow} />;
ClusterTemplatesList.displayName = 'ClusterTemplatesList';

const ClusterTemplatesPage: React.FC<ClusterTemplatesPageProps> = props => {
  return <ListPage canCreate={true} kind={kind} ListComponent={ClusterTemplatesList} {...props} />;
};
ClusterTemplatesPage.displayName = 'ClusterTemplatesPage';

export { ClusterTemplatesList, ClusterTemplatesPage, ClusterTemplatesDetailsPage };

type ClusterTemplatesPageProps = {};

type ClusterTemplatesDetailsPageProps = {
  match: any;
};
