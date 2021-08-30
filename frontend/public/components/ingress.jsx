import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { DetailsPage, ListPage, Table, TableData } from './factory';
import {
  Kebab,
  SectionHeading,
  LabelList,
  ResourceKebab,
  ResourceIcon,
  detailsPage,
  EmptyBox,
  navFactory,
  ResourceLink,
  ResourceSummary,
} from './utils';

const menuActions = Kebab.factory.common;

export const ingressValidHosts = (ingress) =>
  _.map(_.get(ingress, 'spec.rules', []), 'host').filter(_.isString);

const getPort = (service) => service?.port?.number || service?.port?.name;

const getHosts = (ingress) => {
  const hosts = ingressValidHosts(ingress);

  if (hosts.length) {
    const hostsStr = hosts.join(', ');
    return (
      <div className="co-truncate co-select-to-copy" title={hostsStr}>
        {hostsStr}
      </div>
    );
  }

  return <div className="text-muted">No hosts</div>;
};

const TLSCert = ({ ingress }) => {
  const { t } = useTranslation();
  if (!_.has(ingress.spec, 'tls')) {
    return (
      <div>
        <span>{t('public~Not configured')}</span>
      </div>
    );
  }

  const certs = _.map(ingress.spec.tls, 'secretName');

  return (
    <div>
      <ResourceIcon kind="Secret" />
      <span>{certs.join(', ')}</span>
    </div>
  );
};

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

const kind = 'Ingress';

const IngressTableRow = ({ obj: ingress }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={ingress.metadata.name}
          namespace={ingress.metadata.namespace}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={ingress.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={ingress.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{getHosts(ingress)}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={ingress} />
      </TableData>
    </>
  );
};

const RulesHeader = () => {
  const { t } = useTranslation();
  return (
    <div className="row co-m-table-grid__head">
      <div className="col-xs-6 col-sm-4 col-md-2">{t('public~Host')}</div>
      <div className="col-xs-6 col-sm-4 col-md-2">{t('public~Path')}</div>
      <div className="col-md-3 hidden-sm hidden-xs">{t('public~Path type')}</div>
      <div className="col-sm-4 col-md-2 hidden-xs">{t('public~Service')}</div>
      <div className="col-md-2 hidden-sm hidden-xs">{t('public~Service port')}</div>
    </div>
  );
};

const RulesRow = ({ rule, namespace }) => {
  return (
    <div className="row co-resource-list__item">
      <div className="col-xs-6 col-sm-4 col-md-2 co-break-word">
        <div>{rule.host}</div>
      </div>
      <div className="col-xs-6 col-sm-4 col-md-2 co-break-word">
        <div>{rule.path}</div>
      </div>
      <div className="col-md-3 hidden-sm hidden-xs co-break-word">
        <div>{rule.pathType}</div>
      </div>
      <div className="col-sm-4 col-md-2 hidden-xs">
        {rule.serviceName ? (
          <ResourceLink kind="Service" name={rule.serviceName} namespace={namespace} />
        ) : (
          '-'
        )}
      </div>
      <div className="col-xs-2 hidden-sm hidden-xs">
        <div>{rule.servicePort || '-'}</div>
      </div>
    </div>
  );
};

const RulesRows = (props) => {
  const rules = [];

  if (_.has(props.spec, 'rules')) {
    _.forEach(props.spec.rules, (rule) => {
      const paths = _.get(rule, 'http.paths');
      if (_.isEmpty(paths)) {
        rules.push({
          host: rule.host || '*',
          path: '*',
          serviceName: props.spec?.defaultBackend?.service?.name,
          servicePort: getPort(props.spec?.defaultBackend?.service),
        });
      } else {
        _.forEach(paths, (path) => {
          rules.push({
            host: rule.host || '*',
            path: path.path || '*',
            pathType: path.pathType,
            serviceName: path.backend.service?.name,
            servicePort: getPort(path.backend.service),
          });
        });
      }
    });

    const rows = _.map(rules, (rule) => {
      return <RulesRow rule={rule} key={rule.serviceName} namespace={props.namespace} />;
    });

    return <div className="co-m-table-grid__body"> {rows} </div>;
  }

  return <EmptyBox label="Rules" />;
};

const Details = ({ obj: ingress }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Ingress details')} />
        <ResourceSummary resource={ingress}>
          <dt>{t('public~TLS certificate')}</dt>
          <dd>
            <TLSCert ingress={ingress} />
          </dd>
        </ResourceSummary>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Ingress rules')} />
        <p className="co-m-pane__explanation">
          {t(
            'public~These rules are handled by a routing layer (Ingress Controller) which is updated as the rules are modified. The Ingress controller implementation defines how headers and other metadata are forwarded or manipulated',
          )}
        </p>
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <RulesHeader />
          <RulesRows spec={ingress.spec} namespace={ingress.metadata.namespace} />
        </div>
      </div>
    </>
  );
};
const IngressesDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[navFactory.details(detailsPage(Details)), navFactory.editYaml()]}
  />
);
const IngressesList = (props) => {
  const { t } = useTranslation();
  const IngressTableHeader = () => {
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
        title: t('public~Labels'),
        sortField: 'metadata.labels',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Hosts'),
        sortFunc: 'ingressValidHosts',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[4] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={t('public~Ingresses')}
      Header={IngressTableHeader}
      Row={IngressTableRow}
      virtualize
    />
  );
};
const IngressesPage = (props) => (
  <ListPage ListComponent={IngressesList} canCreate={true} {...props} />
);

export { IngressesList, IngressesPage, IngressesDetailsPage };
