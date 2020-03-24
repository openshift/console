import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { Status } from '@console/shared';
import {
  DetailsPage,
  ListPage,
  Table,
  TableData,
  TableRow,
  RowFunction,
} from '@console/internal/components/factory';
import {
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from '@console/internal/components/utils';
import { ResourceEventStream } from '@console/internal/components/events';
import {
  NooBaaObjectBucketClaimModel,
  NooBaaObjectBucketModel,
} from '@console/noobaa-storage-plugin/src/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { sortable } from '@patternfly/react-table';
import { getPhase } from '../../utils';
import { obStatusFilter } from '../../table-filters';

const kind = referenceForModel(NooBaaObjectBucketModel);
const menuActions = [...Kebab.factory.common];

const OBStatus: React.FC<OBStatusProps> = ({ ob }) => <Status status={getPhase(ob)} />;

const tableColumnClasses = [
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-6', 'hidden-xs'),
  classNames('col-lg-4', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const OBTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status',
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Storage Class',
      sortField: 'spec.storageClassName',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
OBTableHeader.displayName = 'OBTableHeader';

const OBTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <OBStatus ob={obj} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {_.get(obj, 'spec.storageClassName', '-')}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const storageClassName = _.get(obj, 'spec.storageClassName');
  const [OBCName, OBCNamespace] = [
    _.get(obj, 'spec.claimRef.name'),
    _.get(obj, 'spec.claimRef.namespace'),
  ];
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Object Bucket Details" />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} />
          </div>
          <div className="col-sm-6">
            <dl>
              <dt>Status</dt>
              <dd>
                <OBStatus ob={obj} />
              </dd>
              <dt>Storage Class</dt>
              <dd>
                {storageClassName ? (
                  <ResourceLink kind="StorageClass" name={storageClassName} />
                ) : (
                  '-'
                )}
              </dd>
              <dt>Object Bucket Claim</dt>
              <dd>
                <ResourceLink
                  kind={referenceForModel(NooBaaObjectBucketClaimModel)}
                  name={OBCName}
                  namespace={OBCNamespace}
                />
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </>
  );
};

const ObjectBucketsList: React.FC = (props) => (
  <Table
    {...props}
    aria-label="Object Buckets"
    Header={OBTableHeader}
    Row={OBTableRow}
    virtualize
  />
);

export const ObjectBucketsPage: React.FC = (props) => (
  <ListPage
    {...props}
    ListComponent={ObjectBucketsList}
    kind={kind}
    rowFilters={[obStatusFilter]}
  />
);

export const ObjectBucketDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[
      navFactory.details(Details),
      navFactory.editYaml(),
      navFactory.events(ResourceEventStream),
    ]}
  />
);

type OBStatusProps = {
  ob: K8sResourceKind;
};

type DetailsProps = {
  obj: K8sResourceKind;
};
