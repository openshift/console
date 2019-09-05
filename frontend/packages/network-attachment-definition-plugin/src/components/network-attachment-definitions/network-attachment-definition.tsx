import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { ListPage, Table, TableData, TableRow } from '@console/internal/components/factory';
import { Kebab, ResourceKebab, ResourceLink } from '@console/internal/components/utils';
import { NamespaceModel } from '@console/internal/models';
import { K8sResourceKindReference } from '@console/internal/module/k8s';
import { getName, getNamespace, getUID } from '@console/shared/src';
import { getConfig } from '../../utils';
import { NetworkAttachmentDefinitionModel } from '../../models';
import { NetworkAttachmentDefinitionKind } from '../../types';

const { common } = Kebab.factory;
const menuActions = [...common];

export const NetworkAttachmentDefinitionReference: K8sResourceKindReference =
  'NetworkAttachmentDefinition';

const tableColumnClasses = [
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-4', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-4', 'col-md-4', 'col-sm-6', 'col-xs-6'),
  Kebab.columnClass,
];

const NetworkAttachmentDefinitionsHeader = () => {
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
      title: 'Type',
      sortFunc: 'string',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
NetworkAttachmentDefinitionsHeader.displayName = 'NADTableHeader';

const NetworkAttachmentDefinitionsRow: React.FC<NetworkAttachmentDefinitionsRowProps> = ({
  obj,
  index,
  key,
  style,
}) => {
  const config = getConfig(obj);
  const name = getName(obj);
  const namespace = getNamespace(obj);
  const uid = getUID(obj);

  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink
          kind={NetworkAttachmentDefinitionModel.kind}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {config.type || <span className="text-secondary">Not available</span>}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab
          actions={menuActions}
          kind={NetworkAttachmentDefinitionReference}
          resource={obj}
        />
      </TableData>
    </TableRow>
  );
};
NetworkAttachmentDefinitionsRow.displayName = 'NetworkAttachmentDefinitionsRow';

type NetworkAttachmentDefinitionsRowProps = {
  obj: NetworkAttachmentDefinitionKind;
  index: number;
  key?: string;
  style: object;
  namespace: string;
};

export const NetworkAttachmentDefinitionsList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label={NetworkAttachmentDefinitionModel.labelPlural}
    Header={NetworkAttachmentDefinitionsHeader}
    Row={NetworkAttachmentDefinitionsRow}
    virtualize
  />
);
NetworkAttachmentDefinitionsList.displayName = 'NetworkAttachmentDefinitionsList';

export const NetworkAttachmentDefinitionsPage: React.SFC<NetworkAttachmentDefinitionsPageProps> = (
  props,
) => (
  <ListPage
    {...props}
    title={NetworkAttachmentDefinitionModel.labelPlural}
    kind={NetworkAttachmentDefinitionReference}
    ListComponent={NetworkAttachmentDefinitionsList}
    filterLabel={props.filterLabel}
    canCreate
  />
);
NetworkAttachmentDefinitionsPage.displayName = 'NetworkAttachmentDefinitionsPage';

type NetworkAttachmentDefinitionsPageProps = {
  filterLabel: string;
  namespace: string;
};
