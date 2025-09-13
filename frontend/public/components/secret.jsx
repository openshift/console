import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage } from './factory';
import { SecretData } from './configmap-and-secret-data';
import { DASH } from '@console/shared';
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
import { configureAddSecretToWorkloadModal } from './modals/add-secret-to-workload';
import { DetailsItem } from './utils/details-item';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ResourceDataView } from '@console/app/src/components/data-view/ResourceDataView';

const cellIsStickyProps = {
  isStickyColumn: true,
  stickyMinWidth: '0',
};

const nameCellProps = {
  ...cellIsStickyProps,
  hasRightBorder: true,
};

const getNameCellProps = (name) => {
  return {
    ...nameCellProps,
    'data-test': `data-view-cell-${name}-name`,
  };
};

const actionsCellProps = {
  ...cellIsStickyProps,
  hasLeftBorder: true,
  isActionCell: true,
};

const initialFiltersDefault = {
  name: '',
  label: '',
};

export const addSecretToWorkload = (kindObj, secret) => {
  const { name: secretName, namespace } = secret.metadata;

  return {
    callback: () => configureAddSecretToWorkloadModal({ secretName, namespace, blocking: true }),
    label: i18next.t('public~Add Secret to workload'),
  };
};

const actionButtons = [addSecretToWorkload];

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

// Cell configuration definitions
const cellConfigs = [
  {
    id: 'name',
    getCell: (secret, dataSize, name, namespace) => (
      <ResourceLink kind="Secret" name={name} namespace={namespace} />
    ),
    getProps: (secret, name) => getNameCellProps(name),
  },
  {
    id: 'namespace',
    getCell: (secret, dataSize, name, namespace) => (
      <ResourceLink kind="Namespace" name={namespace} />
    ),
    getProps: () => undefined,
  },
  {
    id: 'type',
    getCell: (secret) => secret.type,
    getProps: () => undefined,
  },
  {
    id: 'size',
    getCell: (secret, dataSize) => dataSize,
    getProps: () => undefined,
  },
  {
    id: 'created',
    getCell: (secret) => <Timestamp timestamp={secret.metadata.creationTimestamp} />,
    getProps: () => undefined,
  },
  {
    id: 'actions',
    getCell: (secret) => <ResourceKebab actions={menuActions} kind={kind} resource={secret} />,
    getProps: () => actionsCellProps,
  },
];

// Function to convert table rows to DataView format
const getDataViewRows = (data, columns) => {
  return data.map(({ obj: secret }) => {
    const dataSize = _.size(secret.data);
    const { name, namespace } = secret.metadata;

    return columns.map(({ id }) => {
      const config = cellConfigs.find((cfg) => cfg.id === id);
      const cell = config ? config.getCell(secret, dataSize, name, namespace) : DASH;
      const props = config ? config.getProps(secret, dataSize, name, namespace) : undefined;

      return {
        id,
        props,
        cell,
      };
    });
  });
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
  const { data, loaded } = props;

  const columns = [
    {
      id: 'name',
      title: t('public~Name'),
      sort: 'metadata.name',
      props: {
        ...cellIsStickyProps,
        modifier: 'nowrap',
      },
    },
    {
      id: 'namespace',
      title: t('public~Namespace'),
      sort: 'metadata.namespace',
      props: {
        modifier: 'nowrap',
      },
    },
    {
      id: 'type',
      title: t('public~Type'),
      sort: 'type',
      props: {
        modifier: 'nowrap',
      },
    },
    {
      id: 'size',
      title: t('public~Size'),
      sort: (dataRows, direction) => {
        return dataRows.sort((a, b) => {
          const aSize = _.size(a.obj.data);
          const bSize = _.size(b.obj.data);
          return direction === 'asc' ? aSize - bSize : bSize - aSize;
        });
      },
      props: {
        modifier: 'nowrap',
      },
    },
    {
      id: 'created',
      title: t('public~Created'),
      sort: 'metadata.creationTimestamp',
      props: {
        modifier: 'nowrap',
      },
    },
    {
      id: 'actions',
      title: '',
      props: {
        ...cellIsStickyProps,
      },
    },
  ];

  return (
    <ResourceDataView
      {...props}
      label={t('public~Secrets')}
      data={data}
      loaded={loaded}
      columns={columns}
      getDataViewRows={getDataViewRows}
      initialFilters={initialFiltersDefault}
      hideColumnManagement={true}
      data-test="data-view-table"
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
      omitFilterToolbar={true}
      hideColumnManagement={true}
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
