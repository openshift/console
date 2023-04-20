import * as _ from 'lodash-es';
import * as React from 'react';
import { safeDump } from 'js-yaml';
import { Base64 } from 'js-base64';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { DetailsPage, ListPage, Table, TableData } from './factory';
import {
  Kebab,
  SectionHeading,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  Timestamp,
} from './utils';
import { k8sList } from '../module/k8s';
import { SecretModel, ServiceAccountModel } from '../models';
import { SecretsList } from './secret';
import { errorModal } from './modals';
import { ListPageBody } from '@console/dynamic-plugin-sdk';
import { useListPageFilter } from '@console/internal/components/factory/ListPage/filter-hook';
import ListPageFilter from '@console/internal/components/factory/ListPage/ListPageFilter';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

const KubeConfigify = (kind, sa) => ({
  label: i18next.t('public~Download kubeconfig file'),
  weight: 200,
  callback: () => {
    const name = sa.metadata.name;
    const namespace = sa.metadata.namespace;

    k8sList(SecretModel, { ns: namespace })
      .then((secrets) => {
        const server = window.SERVER_FLAGS.kubeAPIServerURL;
        const url = new URL(server);
        const clusterName = url.host.replace(/\./g, '-');

        // Find the secret that is the service account token.
        const saSecretsByName = _.keyBy(sa.secrets, 'name');
        const secret = _.find(
          secrets,
          (s) =>
            saSecretsByName[s.metadata.name] && s.type === 'kubernetes.io/service-account-token',
        );
        if (!secret) {
          errorModal({
            error: i18next.t('public~Unable to get ServiceAccount token.'),
          });
          return;
        }
        const token = Base64.decode(secret.data.token);
        const cert = secret.data['ca.crt'];

        const config = {
          apiVersion: 'v1',
          clusters: [
            {
              cluster: {
                'certificate-authority-data': cert,
                server,
              },
              name: clusterName,
            },
          ],
          contexts: [
            {
              context: {
                cluster: clusterName,
                namespace,
                user: name,
              },
              name,
            },
          ],
          'current-context': name,
          kind: 'Config',
          preferences: {},
          users: [
            {
              name,
              user: {
                token,
              },
            },
          ],
        };
        const dump = safeDump(config);
        const blob = new Blob([dump], { type: 'text/yaml;charset=utf-8' });
        saveAs(blob, `kube-config-sa-${name}-${clusterName}`);
      })
      .catch((err) => {
        const error = err.message;
        errorModal({ error });
      });
  },
  accessReview: {
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    namespace: sa.metadata.namespace,
    verb: 'list',
  },
});
const { common } = Kebab.factory;
const menuActions = [
  KubeConfigify,
  ...Kebab.getExtensionsActionsForKind(ServiceAccountModel),
  ...common,
];

const kind = 'ServiceAccount';

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-md',
  Kebab.columnClass,
];

const ServiceAccountTableRow = ({ obj: serviceaccount }) => {
  const {
    metadata: { name, namespace, uid, creationTimestamp },
    secrets,
  } = serviceaccount;
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={name} namespace={namespace} title={uid} />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={namespace} title={namespace} /> {}
      </TableData>
      <TableData className={tableColumnClasses[2]}>{secrets ? secrets.length : 0}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={serviceaccount} />
      </TableData>
    </>
  );
};

const Details = ({ obj: serviceaccount }) => {
  const { t } = useTranslation();
  const {
    metadata: { namespace },
    secrets,
  } = serviceaccount;
  const serviceAcctSecrets = [...new Set(secrets?.map((s) => s.name))];
  const [resources, loaded, loadError] = useK8sWatchResource({
    groupVersionKind: {
      group: SecretModel.apiGroup,
      kind: SecretModel.kind,
      version: SecretModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
  });
  const [data, filteredData, onFilterChange] = useListPageFilter(resources, [], {
    'secrets-service-account': { selected: serviceAcctSecrets },
  });

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~ServiceAccount details')} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={serviceaccount} />
          </div>
        </div>
      </div>
      <ListPageBody>
        <SectionHeading text={t('public~Secrets')} />
        <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
        <SecretsList
          data={filteredData}
          unfilteredData={resources}
          loaded={loaded}
          loadError={loadError}
        />
      </ListPageBody>
    </>
  );
};

const ServiceAccountsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[navFactory.details(Details), navFactory.editYaml()]}
  />
);

const ServiceAccountsList = (props) => {
  const { t } = useTranslation();
  const ServiceAccountTableHeader = () => {
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
        id: 'namespace',
      },
      {
        title: t('public~Secrets'),
        sortField: 'secrets',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[4] },
      },
    ];
  };
  ServiceAccountTableHeader.displayName = 'ServiceAccountTableHeader';

  return (
    <Table
      {...props}
      aria-label={t('public~ServiceAccounts')}
      Header={ServiceAccountTableHeader}
      Row={ServiceAccountTableRow}
      virtualize
    />
  );
};
const ServiceAccountsPage = (props) => (
  <ListPage ListComponent={ServiceAccountsList} {...props} canCreate={true} />
);
export { ServiceAccountsList, ServiceAccountsPage, ServiceAccountsDetailsPage };
