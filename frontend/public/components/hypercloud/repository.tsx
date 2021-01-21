import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { RepositoryModel } from '../../models/hypercloud';
import { Tags } from './tags';

export const menuActions = [...Kebab.factory.common];

const kind = RepositoryModel.kind;

const tableColumnClasses = [
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const RepositoryTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={obj.metadata.name}
          displayName={obj.spec.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.uid}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const RepositoryTableHeader = () => {
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

RepositoryTableHeader.displayName = 'RepositoryTableHeader';


const RepositoriesList = (props) => (
  <Table
    {...props}
    aria-label="Repositories"
    Header={RepositoryTableHeader}
    Row={RepositoryTableRow}
    virtualize
  />
);
const RepositoriesPage = (props) => {
  const { canCreate = true } = props;
  return (
    <>
      <button className="pf-c-dropdown__toggle pf-m-primary">
        Image Scan Request Creation
      </button>
      <ListPage canCreate={canCreate} kind="Repository" ListComponent={RepositoriesList} {...props} />
    </>
  );
};

const RepositoryDetails: React.FC<RepositoryDetailsProps> = ({ obj: repository }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Registry Details" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={repository} showPodSelector={false} showNodeSelector={false} showAnnotations={false} showTolerations={false} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Resources" />
      <Tags tags={repository.spec.versions} namespace={repository.metadata.namespace} />
    </div>
  </>
);

const { details, editYaml } = navFactory;

const RepositoriesDetailsPage: React.FC<RepositoriesDetailsPageProps> = props => <DetailsPage
  {...props}
  kind={kind}
  menuActions={menuActions}
  pages={[
    details(detailsPage(RepositoryDetails)),
    editYaml(),
  ]}
/>;


type RepositoryDetailsProps = {
  obj: K8sResourceKind;
};

type RepositoriesDetailsPageProps = {
  match: any;
};

export { RepositoriesPage, RepositoriesDetailsPage };