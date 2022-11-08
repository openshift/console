import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { Status } from '@console/shared';
import {
  DetailsPage,
  ListPage,
  Table,
  TableData,
  RowFunctionArgs,
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
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { sortable } from '@patternfly/react-table';
import { NooBaaObjectBucketClaimModel, NooBaaObjectBucketModel } from '../../models';
import { getPhase } from '../../utils';
import { obStatusFilter } from '../../utils/table-filters';

const kind = referenceForModel(NooBaaObjectBucketModel);
const menuActions = [...Kebab.factory.common];

const OBStatus: React.FC<OBStatusProps> = ({ ob }) => <Status status={getPhase(ob)} />;

const tableColumnClasses = [
  '',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-25-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

const OBTableRow: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1])}>
        <OBStatus ob={obj} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {_.get(obj, 'spec.storageClassName', '-')}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab
          actions={menuActions}
          kind={kind}
          resource={obj}
          terminatingTooltip={t(
            'ceph-storage-plugin~The corresponding ObjectBucketClaim must be deleted first.',
          )}
        />
      </TableData>
    </>
  );
};

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation();

  const storageClassName = _.get(obj, 'spec.storageClassName');
  const [OBCName, OBCNamespace] = [
    _.get(obj, 'spec.claimRef.name'),
    _.get(obj, 'spec.claimRef.namespace'),
  ];
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('ceph-storage-plugin~Object Bucket Details')} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} />
          </div>
          <div className="col-sm-6">
            <dl>
              <dt>{t('ceph-storage-plugin~Status')}</dt>
              <dd>
                <OBStatus ob={obj} />
              </dd>
              <dt>{t('ceph-storage-plugin~StorageClass')}</dt>
              <dd>
                {storageClassName ? (
                  <ResourceLink kind="StorageClass" name={storageClassName} />
                ) : (
                  '-'
                )}
              </dd>
              <dt>{t('ceph-storage-plugin~Object Bucket Claim')}</dt>
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

const ObjectBucketsList: React.FC = (props) => {
  const { t } = useTranslation();

  const OBTableHeader = () => {
    return [
      {
        title: t('ceph-storage-plugin~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('ceph-storage-plugin~Status'),
        sortField: 'status.phase',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('ceph-storage-plugin~StorageClass'),
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
  OBTableHeader.displayName = t('ceph-storage-plugin~OBTableHeader');

  return (
    <Table
      {...props}
      aria-label={t('ceph-storage-plugin~Object Buckets')}
      Header={OBTableHeader}
      Row={OBTableRow}
      virtualize
    />
  );
};

export const ObjectBucketsPage: React.FC = (props) => {
  const { t } = useTranslation();

  return (
    <ListPage
      {...props}
      title={t('ceph-storage-plugin~Object Buckets')}
      ListComponent={ObjectBucketsList}
      kind={kind}
      rowFilters={[obStatusFilter(t)]}
    />
  );
};

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
