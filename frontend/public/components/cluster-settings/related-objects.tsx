import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import '@patternfly/patternfly/patternfly-addons.css';
import { useTranslation } from 'react-i18next';
import { Table, TableData, RowFunctionArgs } from '../factory';
import {
  referenceForModel,
  ClusterOperator,
  ClusterOperatorObjectReference,
  useModelFinder,
} from '../../module/k8s';
import { ResourceLink, EmptyBox } from '../utils';

const tableColumnClasses = [
  '', // Name
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'), // Resource
  classNames('pf-m-hidden', 'pf-m-visible-on-md'), // Group
  '', // NS
];

const ResourceObjectName: React.FC<ResourceObjectNameProps> = ({ gsv, name, namespace }) => {
  if (!name) {
    return <>-</>;
  }
  if (gsv) {
    return <ResourceLink kind={gsv} name={name} namespace={namespace} />;
  }
  return <>{name}</>;
};

const Row: React.FC<RowFunctionArgs> = ({ obj, customData: { findModel } }) => {
  const { name, resource, namespace, group } = obj;
  const model = findModel(group, resource);

  const gsv = model ? referenceForModel(model) : null;
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceObjectName gsv={gsv} name={name} namespace={namespace} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        {resource}
        {group && <div className="pf-u-display-none-on-md text-muted">{group}</div>}
      </TableData>
      <TableData className={tableColumnClasses[2]}>{group || '-'}</TableData>
      <TableData className={tableColumnClasses[3]}>
        {namespace ? <ResourceLink kind="Namespace" name={namespace} /> : '-'}
      </TableData>
    </>
  );
};

const EmptyMessage = () => {
  const { t } = useTranslation();
  return <EmptyBox label={t('public~Related objects')} />;
};

const RelatedObjects: React.FC<RelatedObjectsProps> = (props) => {
  const { findModel } = useModelFinder();
  const { t } = useTranslation();
  const Header = () => [
    {
      title: t('public~Name'),
      sortField: 'name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('public~Resource'),
      sortField: 'resource',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('public~Group'),
      sortField: 'group',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('public~Namespace'),
      sortField: 'namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
  ];
  const customData = React.useMemo(
    () => ({
      findModel,
    }),
    [findModel],
  );
  return (
    <div className="co-m-pane__body">
      <Table
        {...props}
        Header={Header}
        Row={Row}
        customData={customData}
        aria-label={t('public~Related objects')}
        NoDataEmptyMsg={EmptyMessage}
      />
    </div>
  );
};

const RelatedObjectsPage: React.FC<RelatedObjectsPageProps> = (props) => {
  const relatedObject: ClusterOperatorObjectReference[] = props.obj?.status?.relatedObjects;
  const data = relatedObject?.filter(({ resource }) => resource);
  return <RelatedObjects {...props} data={data} />;
};

export default RelatedObjectsPage;

type ResourceObjectNameProps = {
  gsv: string;
  name: string;
  namespace: string;
};

type RelatedObjectsPageProps = {
  obj: ClusterOperator;
};

type RelatedObjectsProps = {
  data: ClusterOperatorObjectReference[];
};
