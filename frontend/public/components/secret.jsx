import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { SecretData } from './configmap-and-secret-data';
import {
  Kebab,
  SectionHeading,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  Timestamp,
  detailsPage,
  navFactory,
  resourceObjPath,
} from './utils';
import { SecretType } from './secrets/create-secret';
import { configureAddSecretToWorkloadModal } from './modals/add-secret-to-workload';

export const WebHookSecretKey = 'WebHookSecretKey';

export const addSecretToWorkload = (kindObj, secret) => {
  const { name: secretName, namespace } = secret.metadata;

  return {
    callback: () => configureAddSecretToWorkloadModal({ secretName, namespace, blocking: true }),
    label: 'Add Secret to Workload',
  };
};

const actionButtons = [addSecretToWorkload];

const menuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  (kind, obj) => ({
    label: `Edit ${kind.label}`,
    href: `${resourceObjPath(obj, kind.kind)}/edit`,
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'update',
    },
  }),
  Kebab.factory.Delete,
];

const kind = 'Secret';

const tableColumnClasses = [
  classNames('col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-1', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const SecretTableHeader = () => {
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
      sortField: 'type',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Size',
      sortFunc: 'dataSize',
      transforms: [sortable],
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
SecretTableHeader.displayName = 'SecretTableHeader';

const SecretTableRow = ({ obj: secret, index, key, style }) => {
  const data = _.size(secret.data);
  return (
    <TableRow id={secret.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind="Secret"
          name={secret.metadata.name}
          namespace={secret.metadata.namespace}
          title={secret.metadata.uid}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink
          kind="Namespace"
          name={secret.metadata.namespace}
          title={secret.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        {secret.type}
      </TableData>
      <TableData className={tableColumnClasses[3]}>{data}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={secret.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={secret} />
      </TableData>
    </TableRow>
  );
};

const SecretDetails = ({ obj: secret }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Secret Details" />
        <ResourceSummary resource={secret} />
      </div>
      <div className="co-m-pane__body">
        <SecretData data={secret.data} type={secret.type} />
      </div>
    </>
  );
};

const SecretsList = (props) => (
  <Table
    {...props}
    aria-label="Secrets"
    Header={SecretTableHeader}
    Row={SecretTableRow}
    virtualize
  />
);
SecretsList.displayName = 'SecretsList';

const IMAGE_FILTER_VALUE = 'Image';
const SOURCE_FILTER_VALUE = 'Source';
const TLS_FILTER_VALUE = 'TLS';
const SA_TOKEN_FILTER_VALUE = 'Service Account Token';
const OPAQUE_FILTER_VALUE = 'Opaque';

const secretTypeFilterValues = [
  IMAGE_FILTER_VALUE,
  SOURCE_FILTER_VALUE,
  TLS_FILTER_VALUE,
  SA_TOKEN_FILTER_VALUE,
  OPAQUE_FILTER_VALUE,
];

export const secretTypeFilterReducer = (secret) => {
  switch (secret.type) {
    case SecretType.dockercfg:
    case SecretType.dockerconfigjson:
      return IMAGE_FILTER_VALUE;

    case SecretType.basicAuth:
    case SecretType.sshAuth:
      return SOURCE_FILTER_VALUE;

    case SecretType.tls:
      return TLS_FILTER_VALUE;

    case SecretType.serviceAccountToken:
      return SA_TOKEN_FILTER_VALUE;

    default:
      // This puts all unrecognized types under "Opaque". Since unrecognized types should be uncommon,
      // it avoids an "Other" category that is usually empty.
      return OPAQUE_FILTER_VALUE;
  }
};

const filters = [
  {
    filterGroupName: 'Type',
    type: 'secret-type',
    reducer: secretTypeFilterReducer,
    items: secretTypeFilterValues.map((filterValue) => ({ id: filterValue, title: filterValue })),
  },
];

const SecretsPage = (props) => {
  const createItems = {
    generic: 'Key/Value Secret',
    image: 'Image Pull Secret',
    source: 'Source Secret',
    webhook: 'Webhook Secret',
    yaml: 'From YAML',
  };

  const createProps = {
    items: createItems,
    createLink: (type) =>
      `/k8s/ns/${props.namespace || 'default'}/secrets/~new/${type !== 'yaml' ? type : ''}`,
  };

  return (
    <ListPage
      ListComponent={SecretsList}
      canCreate={true}
      rowFilters={filters}
      createButtonText="Create"
      createProps={createProps}
      {...props}
    />
  );
};

const SecretsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    buttonActions={actionButtons}
    menuActions={menuActions}
    pages={[navFactory.details(detailsPage(SecretDetails)), navFactory.editYaml()]}
  />
);

export { SecretsList, SecretsPage, SecretsDetailsPage };
