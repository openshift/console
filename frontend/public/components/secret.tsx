import * as _ from 'lodash-es';
import { Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage } from './factory';
import { SecretData } from './configmap-and-secret-data';
import { DASH } from '@console/shared/src/constants/ui';
import { LazyActionMenu, ActionMenuVariant } from '@console/shared/src/components/actions';
import {
  referenceFor,
  SecretKind,
  K8sModel,
  K8sResourceKind,
  referenceForModel,
  TableColumn,
} from '../module/k8s';
import { SectionHeading } from './utils/headings';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary, detailsPage } from './utils/details-page';
import { navFactory } from './utils/horizontal-nav';
import { SecretType } from './secrets/create-secret/types';
import { useAddSecretToWorkloadModalLauncher } from './modals/add-secret-to-workload';
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
import { SecretModel } from '../models';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';

const kindRef = referenceForModel(SecretModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'type' },
  { id: 'size' },
  { id: 'created' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<any, undefined> = (data, columns) => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const resourceKind = referenceFor(obj);
    const context = { [resourceKind]: obj };

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
        cell: obj.type,
      },
      [tableColumnInfo[3].id]: {
        cell: _.size(obj.data),
      },
      [tableColumnInfo[4].id]: {
        cell: <Timestamp timestamp={obj.metadata.creationTimestamp || ''} />,
      },
      [tableColumnInfo[5].id]: {
        cell: <LazyActionMenu context={context} />,
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

const SecretDetails: React.FCC<{ obj: SecretKind }> = ({ obj }) => {
  const { t } = useTranslation();
  const { data, type } = obj;
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~Secret details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={obj} />
          </GridItem>
          {type && (
            <GridItem md={6}>
              <DescriptionList data-test-id="resource-type">
                <DetailsItem label={t('public~Type')} obj={obj} path="type" />
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

const useSecretsColumns = (): TableColumn<any>[] => {
  const { t } = useTranslation();
  const columns = useMemo(() => {
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

const SecretsList: React.FCC<SecretsListProps> = ({ data, loaded, ...props }) => {
  const columns = useSecretsColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
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
    </Suspense>
  );
};
SecretsList.displayName = 'SecretsList';

const IMAGE_FILTER_VALUE = 'Image';
const SOURCE_FILTER_VALUE = 'Source';
const TLS_FILTER_VALUE = 'TLS';
const SA_TOKEN_FILTER_VALUE = 'Service Account Token';
const OPAQUE_FILTER_VALUE = 'Opaque';

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
      kind={kindRef}
      ListComponent={SecretsList}
      canCreate={true}
      rowFilters={filters}
      createButtonText={t('public~Create')}
      createProps={createProps}
      omitFilterToolbar={true}
    />
  );
};

const SecretsDetailsPage: React.FCC<SecretDetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const { name: secretName, namespace, kindObj } = props;

  const addSecretToWorkloadLauncher = useAddSecretToWorkloadModalLauncher({
    secretName,
    namespace,
  });

  const actionButtons = useMemo(
    () => [
      () => ({
        callback: () => addSecretToWorkloadLauncher(),
        label: t('public~Add Secret to workload'),
      }),
    ],
    [t, addSecretToWorkloadLauncher],
  );

  return (
    <DetailsPage
      {...props}
      kind={kindObj.kind}
      buttonActions={actionButtons}
      customActionMenu={(_kindModel: K8sModel, obj: K8sResourceKind) => (
        <LazyActionMenu context={{ [kindRef]: obj }} variant={ActionMenuVariant.DROPDOWN} />
      )}
      pages={[navFactory.details(detailsPage(SecretDetails)), navFactory.editYaml()]}
    />
  );
};

SecretsDetailsPage.displayName = 'SecretsDetailsPage';

type SecretDetailsPageProps = {
  name: string;
  namespace: string;
  badge?: React.ReactNode;
  kindObj: K8sModel;
};

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

export { SecretsList, SecretsPage, SecretsDetailsPage };
