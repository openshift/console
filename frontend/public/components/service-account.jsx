import * as _ from 'lodash-es';
import * as React from 'react';
import { safeDump } from 'js-yaml';
import { Base64 } from 'js-base64';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, SectionHeading, navFactory, ResourceKebab, ResourceLink, ResourceSummary, Timestamp } from './utils';
import { k8sList } from '../module/k8s';
import { SecretModel, ServiceAccountModel } from '../models';
import { SecretsPage } from './secret';
import { saveAs } from 'file-saver';
import { errorModal } from './modals';
import { useTranslation } from 'react-i18next';

const KubeConfigify = (t, kind, sa) => {
  return {
    label: 'Download kubeconfig file',
    weight: 200,
    callback: () => {
      const name = sa.metadata.name;
      const namespace = sa.metadata.namespace;

      k8sList(SecretModel, { ns: namespace })
        .then(secrets => {
          const server = window.SERVER_FLAGS.kubeAPIServerURL;
          const url = new URL(server);
          const clusterName = url.host.replace(/\./g, '-');

          // Find the secret that is the service account token.
          const saSecretsByName = _.keyBy(sa.secrets, 'name');
          const secret = _.find(secrets, s => saSecretsByName[s.metadata.name] && s.type === 'kubernetes.io/service-account-token');
          if (!secret) {
            errorModal({ error: 'Unable to get service account token.' });
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
        .catch(err => {
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
  };
};
const { common } = Kebab.factory;

const kind = 'ServiceAccount';

const tableColumnClasses = [classNames('col-sm-4', 'col-xs-6'), classNames('col-sm-4', 'col-xs-6'), classNames('col-md-2', 'hidden-sm', 'hidden-xs'), classNames('col-sm-2', 'hidden-xs'), Kebab.columnClass];

const ServiceAccountTableHeader = t => {
  return [
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_1'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_2'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_34'),
      sortField: 'secrets',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_12'),
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

const ServiceAccountTableRow = (t, { obj: serviceaccount, index, key, style }) => {
  const {
    metadata: { name, namespace, uid, creationTimestamp },
    secrets,
  } = serviceaccount;
  const menuActions = [KubeConfigify.bind(null, t), ...Kebab.getExtensionsActionsForKind(ServiceAccountModel), ...common];
  return (
    <TableRow id={serviceaccount.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={name} namespace={namespace} title={uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={namespace} title={namespace} /> {}
      </TableData>
      <TableData className={tableColumnClasses[2]}>{secrets ? secrets.length : 0}</TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={serviceaccount} />
      </TableData>
    </TableRow>
  );
};

const Details = ({ obj: serviceaccount }) => {
  const { t } = useTranslation();
  const {
    metadata: { namespace },
    secrets,
  } = serviceaccount;
  const filters = { selector: { field: 'metadata.name', values: new Set(_.map(secrets, 'name')) } };

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: t('COMMON:MSG_LNB_MENU_74') })} />
        <ResourceSummary resource={serviceaccount} />
      </div>
      <div className="co-m-pane__body co-m-pane__body--section-heading">
        <SectionHeading text={t('COMMON:MSG_LNB_MENU_26')} />
      </div>
      <SecretsPage kind="Secret" canCreate={false} namespace={namespace} filters={filters} autoFocus={false} showTitle={false} />
    </>
  );
};

const ServiceAccountsDetailsPage = props => {
  const { t } = useTranslation();
  const menuActions = [KubeConfigify.bind(null, t), ...Kebab.getExtensionsActionsForKind(ServiceAccountModel), ...common];
  return <DetailsPage {...props} menuActions={menuActions} pages={[navFactory.details(Details), navFactory.editYaml()]} />;
};
const ServiceAccountsList = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Service Accounts" Header={ServiceAccountTableHeader.bind(null, t)} Row={ServiceAccountTableRow.bind(null, t)} virtualize />;
};
const ServiceAccountsPage = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_74')} ListComponent={ServiceAccountsList} {...props} canCreate={true} />;
};
export { ServiceAccountsList, ServiceAccountsPage, ServiceAccountsDetailsPage };
