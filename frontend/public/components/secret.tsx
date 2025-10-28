import * as React from 'react';
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
import { DetailsItem } from './utils/details-item';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { LoadingBox } from './utils/status-box';
import { sortResourceByValue } from './factory/Table/sort';
import { sorts } from './factory/table';
import { referenceForModel, TableColumn } from '../module/k8s';
import { SecretModel } from '../models';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';

const kind = referenceForModel(SecretModel);

const IMAGE_FILTER_VALUE = 'Image';
const SOURCE_FILTER_VALUE = 'Source';
const TLS_FILTER_VALUE = 'TLS';
const SA_TOKEN_FILTER_VALUE = 'Service Account Token';
const OPAQUE_FILTER_VALUE = 'Opaque';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'type' },
  { id: 'size' },
  { id: 'created' },
  { id: 'actions' },
];

export const addSecretToWorkload = () => {
  return {
    callback: () => {
      // This will be handled by the modal launcher in the details page
    },
    label: i18next.t('public~Add Secret to workload'),
  };
};

const actionButtons = [addSecretToWorkload];

const menuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  (kindObj, obj) => {
    return {
      // t('public~Edit Secret')
      labelKey: 'public~Edit Secret',
      href: `${resourceObjPath(obj, kindObj.kind)}/edit`,
      accessReview: {
        group: kindObj.apiGroup,
        resource: kindObj.plural,
        name: obj.metadata.name,
        namespace: obj.metadata.namespace,
        verb: 'update',
      },
    };
  },
  Kebab.factory.Delete,
];

const getDataViewRows: GetDataViewRows<any, undefined> = (data, columns) => {
  return data.map(({ obj: secret }) => {
    const { name, namespace } = secret.metadata;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(SecretModel)}
            name={name}
            namespace={namespace}
          />
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: secret.type,
      },
      [tableColumnInfo[3].id]: {
        cell: sorts.dataSize(secret),
      },
      [tableColumnInfo[4].id]: {
        cell: <Timestamp timestamp={secret.metadata.creationTimestamp} />,
      },
      [tableColumnInfo[5].id]: {
        cell: <ResourceKebab actions={menuActions} kind={kind} resource={secret} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const useSecretsColumns = (): TableColumn<any>[] => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Type'),
        id: tableColumnInfo[2].id,
        sort: 'type',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Size'),
        id: tableColumnInfo[3].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, sorts.dataSize)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Created'),
        id: tableColumnInfo[4].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

export const SecretDetails = ({ obj: secret }) => {
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
        <SecretData data={data || {}} />
      </PaneBody>
    </>
  );
};

const SecretsList: React.FCC<SecretsListProps> = ({ data, loaded, ...props }) => {
  const columns = useSecretsColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        label={SecretModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};
SecretsList.displayName = 'SecretsList';

export const secretTypeFilterReducer = (secret): string => {
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

const SecretsPage: React.FCC<SecretsPageProps> = (props) => {
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
      {...props}
      kind={kind}
      ListComponent={SecretsList}
      canCreate={true}
      rowFilters={filters}
      createButtonText={t('public~Create')}
      createProps={createProps}
      omitFilterToolbar={true}
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

type SecretsListProps = {
  data: any[];
  loaded: boolean;
  [key: string]: any;
};

type SecretsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};
