import * as _ from 'lodash-es';
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage, Table, TableData } from './factory';
import { SecretData } from './configmap-and-secret-data';
import {
  Kebab,
  SectionHeading,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  detailsPage,
  navFactory,
  resourceObjPath,
} from './utils';
import { SecretType } from './secrets/create-secret/types';
import { useSecretToWorkloadModalLauncher } from './modals/add-secret-to-workload';
import { DetailsItem } from './utils/details-item';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';

export const addSecretToWorkload = (t, addSecretToWorkloadLauncher) => {
  return () => {
    return {
      callback: () => addSecretToWorkloadLauncher(),
      label: t('public~Add Secret to workload'),
    };
  };
};

const menuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  (kind, obj) => {
    return {
      // t('public~Edit Secret')
      labelKey: 'public~Edit Secret',
      href: `${resourceObjPath(obj, kind.kind)}/edit`,
      accessReview: {
        group: kind.apiGroup,
        resource: kind.plural,
        name: obj.metadata.name,
        namespace: obj.metadata.namespace,
        verb: 'update',
      },
    };
  },
  Kebab.factory.Delete,
];

const kind = 'Secret';

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-xl pf-v6-u-w-8-on-xl',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

const SecretTableRow = ({ obj: secret }) => {
  const data = _.size(secret.data);
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind="Secret"
          name={secret.metadata.name}
          namespace={secret.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={secret.metadata.namespace} />
      </TableData>
      <TableData className={css(tableColumnClasses[2], 'co-break-word')}>{secret.type}</TableData>
      <TableData className={tableColumnClasses[3]}>{data}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={secret.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={secret} />
      </TableData>
    </>
  );
};

const SecretDetails = ({ obj: secret }) => {
  const { t } = useTranslation();
  const { data, type } = secret;
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~Secret details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={secret} />
          </GridItem>
          {type && (
            <GridItem md={6}>
              <DescriptionList data-test-id="resource-type">
                <DetailsItem label={t('public~Type')} obj={secret} path="type" />
              </DescriptionList>
            </GridItem>
          )}
        </Grid>
      </PaneBody>
      <PaneBody>
        <SecretData data={data} type={type} />
      </PaneBody>
    </>
  );
};

const SecretsList = (props) => {
  const { t } = useTranslation();
  const SecretTableHeader = () => [
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
      id: 'namespace',
    },
    {
      title: t('public~Type'),
      sortField: 'type',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('public~Size'),
      sortFunc: 'dataSize',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('public~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label={t('public~Secrets')}
      Header={SecretTableHeader}
      Row={SecretTableRow}
      virtualize
    />
  );
};
SecretsList.displayName = 'SecretsList';

const IMAGE_FILTER_VALUE = 'Image';
const SOURCE_FILTER_VALUE = 'Source';
const TLS_FILTER_VALUE = 'TLS';
const SA_TOKEN_FILTER_VALUE = 'Service Account Token';
const OPAQUE_FILTER_VALUE = 'Opaque';

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

const SecretsPage = (props) => {
  const { t } = useTranslation();
  const createItems = {
    generic: t('public~Key/value secret'),
    image: t('public~Image pull secret'),
    source: t('public~Source secret'),
    webhook: t('public~Webhook secret'),
    yaml: t('public~From YAML'),
  };

  const createProps = {
    items: createItems,
    createLink: (type) =>
      `/k8s/ns/${props.namespace || 'default'}/secrets/~new/${type !== 'yaml' ? type : ''}`,
  };

  const secretTypeFilterValues = [
    {
      id: IMAGE_FILTER_VALUE,
      title: t('public~Image'),
    },
    {
      id: SOURCE_FILTER_VALUE,
      title: t('public~Source'),
    },
    {
      id: TLS_FILTER_VALUE,
      title: t('public~TLS'),
    },
    {
      id: SA_TOKEN_FILTER_VALUE,
      title: t('public~Service Account Token'),
    },
    {
      id: OPAQUE_FILTER_VALUE,
      title: t('public~Opaque'),
    },
  ];

  const filters = [
    {
      filterGroupName: t('public~Type'),
      type: 'secret-type',
      reducer: secretTypeFilterReducer,
      items: secretTypeFilterValues,
    },
  ];

  return (
    <ListPage
      ListComponent={SecretsList}
      canCreate={true}
      rowFilters={filters}
      createButtonText={t('public~Create')}
      createProps={createProps}
      {...props}
    />
  );
};

const SecretsDetailsPage = (props) => {
  const { t } = useTranslation();
  const { name: secretName, namespace } = props;
  const addSecretToWorkloadLauncher = useSecretToWorkloadModalLauncher({ secretName, namespace });

  const actionButtons = React.useMemo(() => [addSecretToWorkload(t, addSecretToWorkloadLauncher)], [
    t,
    addSecretToWorkloadLauncher,
  ]);

  return (
    <DetailsPage
      {...props}
      buttonActions={actionButtons}
      menuActions={menuActions}
      pages={[navFactory.details(detailsPage(SecretDetails)), navFactory.editYaml()]}
    />
  );
};

export { SecretsList, SecretsPage, SecretsDetailsPage };
