import * as _ from 'lodash';
import * as React from 'react';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { sortable } from '@patternfly/react-table';
import { Conditions } from './conditions';
import {
  DetailsPage,
  ListPage,
  Table,
  TableRow,
  TableData,
  RowFunction,
  TableProps,
} from './factory';
import { referenceFor, kindForReference, K8sResourceKind } from '../module/k8s';
import {
  Kebab,
  kindObj,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
} from './utils';

const { common } = Kebab.factory;

const tableColumnClasses = [
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-xs-6', 'col-sm-4'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

const TableHeader = (t: TFunction) => () => {
  return [
    {
      title: t('public~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('public~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('public~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
TableHeader.displayName = 'TableHeader';

const TableRowForKind = (t: TFunction): RowFunction<K8sResourceKind> => ({
  obj,
  index,
  key,
  style,
  customData,
}) => {
  const kind = referenceFor(obj) || customData.kind;
  const menuActions = [...Kebab.getExtensionsActionsForKind(kindObj(kind)), ...common];

  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={customData.kind}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        {obj.metadata.namespace ? (
          <ResourceLink
            kind="Namespace"
            name={obj.metadata.namespace}
            title={obj.metadata.namespace}
          />
        ) : (
          t('public~None')
        )}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

type DetailsForKindProps = {
  obj: K8sResourceKind;
};

export const DetailsForKind = (kind: string, t: TFunction): React.FC<DetailsForKindProps> => ({
  obj,
}) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading
          text={t('public~{{kindReference}} details', { kindReference: kindForReference(kind) })}
        />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary
              resource={obj}
              podSelector="spec.podSelector"
              showNodeSelector={false}
            />
          </div>
        </div>
      </div>
      {_.isArray(obj?.status?.conditions) && (
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Conditions')} />
          <Conditions conditions={obj.status.conditions} />
        </div>
      )}
    </>
  );
};

export const DefaultList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  const { kinds } = props;

  return (
    <Table
      {...props}
      aria-label={t('public~Default Resource')}
      kinds={[kinds[0]]}
      customData={{ kind: kinds[0] }}
      Header={TableHeader(t)}
      Row={TableRowForKind(t)}
      virtualize
    />
  );
};
DefaultList.displayName = 'DefaultList';

export const DefaultPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => (
  <ListPage
    {...props}
    ListComponent={DefaultList}
    canCreate={props.canCreate ?? _.get(kindObj(props.kind), 'crd')}
  />
);
DefaultPage.displayName = 'DefaultPage';

export const DefaultDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const { t } = useTranslation();
  const pages = [navFactory.details(DetailsForKind(props.kind, t)), navFactory.editYaml()];
  const menuActions = [...Kebab.getExtensionsActionsForKind(kindObj(props.kind)), ...common];

  return <DetailsPage {...props} menuActions={menuActions} pages={pages} />;
};
DefaultDetailsPage.displayName = 'DefaultDetailsPage';
