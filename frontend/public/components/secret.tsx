import * as _ from 'lodash-es';
import { useMemo } from 'react';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage, Table, TableData } from './factory';
import { referenceFor, SecretKind, K8sModel, K8sResourceKind } from '../module/k8s';
import { SecretData } from './configmap-and-secret-data';
import {
  Kebab,
  SectionHeading,
  ResourceLink,
  ResourceSummary,
  detailsPage,
  navFactory,
} from './utils';
import { SecretType } from './secrets/create-secret/types';
import { useAddSecretToWorkloadModalLauncher } from './modals/add-secret-to-workload';
import { DetailsItem } from './utils/details-item';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ActionMenuVariant, LazyActionMenu } from '@console/shared/src/components/actions';

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-xl pf-v6-u-w-8-on-xl',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

const SecretTableRow: React.FCC<{ obj: SecretKind }> = ({ obj }) => {
  const data = _.size(obj.data);
  const resourceKind = referenceFor(obj);

  const context = { [resourceKind]: obj };
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind="Secret" name={obj.metadata?.name} namespace={obj.metadata?.namespace} />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata?.namespace} />
      </TableData>
      <TableData className={css(tableColumnClasses[2], 'co-break-word')}>{obj.type}</TableData>
      <TableData className={tableColumnClasses[3]}>{data}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={obj.metadata?.creationTimestamp || ''} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
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

const SecretsList: React.FCC = (props) => {
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

const SecretsDetailsPage: React.FCC<SecretDetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const { name: secretName, namespace, kindObj: kind } = props;

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
      kind={kind.kind}
      buttonActions={actionButtons}
      customActionMenu={(kindObj: K8sModel, obj: K8sResourceKind) => (
        <LazyActionMenu
          context={{ [referenceFor(kindObj)]: obj }}
          variant={ActionMenuVariant.DROPDOWN}
        />
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

export { SecretsList, SecretsPage, SecretsDetailsPage };
