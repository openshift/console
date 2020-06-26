import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Table, TableRow, TableData, RowFunctionArgs } from '../factory';
import {
  referenceForModel,
  ClusterOperator,
  ClusterOperatorObjectReference,
  useModelFinder,
} from '../../module/k8s';
import { ResourceLink, EmptyBox } from '../utils';

const tableColumnClasses = ['', classNames('pf-m-hidden', 'pf-m-visible-on-sm'), ''];

const Header = () => [
  {
    title: 'Name',
    sortField: 'name',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Resource',
    sortField: 'resource',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Namespace',
    sortField: 'namespace',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
];

const Row: React.FC<RowFunctionArgs> = ({ obj, index, key, style, customData: { findModel } }) => {
  const { name, resource, namespace, group } = obj;
  const model = findModel(group, resource);

  const gsv = model ? referenceForModel(model) : null;
  return (
    <TableRow id={key} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        {gsv ? <ResourceLink kind={gsv} name={name} namespace={namespace} /> : name}
      </TableData>
      <TableData className={tableColumnClasses[1]}>{resource}</TableData>
      <TableData className={tableColumnClasses[2]}>
        {namespace ? <ResourceLink kind="Namespace" name={namespace} /> : '-'}
      </TableData>
    </TableRow>
  );
};

const EmptyMessage = () => <EmptyBox label="Related Objects" />;

const RelatedObjects: React.FC<RelatedObjectsProps> = (props) => {
  const { findModel } = useModelFinder();
  return (
    <div className="co-m-pane__body">
      <Table
        {...props}
        Header={Header}
        Row={Row}
        customData={{ findModel }}
        aria-label="Related Objects"
        NoDataEmptyMsg={EmptyMessage}
      />
    </div>
  );
};

const RelatedObjectsPage: React.FC<RelatedObjectsPageProps> = (props) => {
  const relatedObject: ClusterOperatorObjectReference[] = props.obj?.status?.relatedObjects;
  const data = relatedObject?.filter(({ name, resource }) => name && resource);
  return <RelatedObjects {...props} data={data} />;
};

export default RelatedObjectsPage;

type RelatedObjectsPageProps = {
  obj: ClusterOperator;
};

type RelatedObjectsProps = {
  data: ClusterOperatorObjectReference[];
};
