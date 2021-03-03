import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, SectionHeading, LabelList, ResourceKebab, ResourceIcon, detailsPage, EmptyBox, navFactory, ResourceLink, ResourceSummary } from './utils';
import { useTranslation } from 'react-i18next';
const menuActions = Kebab.factory.common;

export const ingressValidHosts = ingress => _.map(_.get(ingress, 'spec.rules', []), 'host').filter(_.isString);

const getHosts = ingress => {
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

const getTLSCert = ingress => {
  if (!_.has(ingress.spec, 'tls')) {
    return (
      <div>
        <span>Not configured</span>
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

const tableColumnClasses = [classNames('col-md-3', 'col-sm-4', 'col-xs-6'), classNames('col-md-3', 'col-sm-4', 'col-xs-6'), classNames('col-md-3', 'col-sm-4', 'hidden-xs'), classNames('col-md-3', 'hidden-sm', 'hidden-xs'), Kebab.columnClass];

const kind = 'Ingress';

const IngressTableHeader = t => {
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
      title: t('COMMON:MSG_MAIN_TABLEHEADER_15'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_28'),
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
IngressTableHeader.displayName = 'IngressTableHeader';

const IngressTableRow = ({ obj: ingress, index, key, style }) => {
  return (
    <TableRow id={ingress.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={ingress.metadata.name} namespace={ingress.metadata.namespace} title={ingress.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={ingress.metadata.namespace} title={ingress.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={ingress.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{getHosts(ingress)}</TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={ingress} />
      </TableData>
    </TableRow>
  );
};

const RulesHeader = () => {
  const { t } = useTranslation();
  return (
    <div className="row co-m-table-grid__head">
      <div className="col-xs-3">{t('COMMON:MSG_DETAILS_TABDETAILS_INGRESSRULES_TABLEHEADER_1')}</div>
      <div className="col-xs-3">{t('COMMON:MSG_DETAILS_TABDETAILS_INGRESSRULES_TABLEHEADER_2')}</div>
      <div className="col-xs-3">{t('COMMON:MSG_DETAILS_TABDETAILS_INGRESSRULES_TABLEHEADER_3')}</div>
      <div className="col-xs-2">{t('COMMON:MSG_DETAILS_TABDETAILS_INGRESSRULES_TABLEHEADER_4')}</div>
    </div>
  );
};

const RulesRow = ({ rule, namespace }) => {
  return (
    <div className="row co-resource-list__item">
      <div className="col-xs-3 co-break-word">
        <div>{rule.host}</div>
      </div>
      <div className="col-xs-3 co-break-word">
        <div>{rule.path}</div>
      </div>
      <div className="col-xs-3">{rule.serviceName ? <ResourceLink kind="Service" name={rule.serviceName} namespace={namespace} /> : '-'}</div>
      <div className="col-xs-2">
        <div>{rule.servicePort || '-'}</div>
      </div>
    </div>
  );
};

const RulesRows = props => {
  const rules = [];

  if (_.has(props.spec, 'rules')) {
    _.forEach(props.spec.rules, rule => {
      const paths = _.get(rule, 'http.paths');
      if (_.isEmpty(paths)) {
        rules.push({
          host: rule.host || '*',
          path: '*',
          serviceName: _.get(props.spec, 'backend.serviceName'),
          servicePort: _.get(props.spec, 'backend.servicePort'),
        });
      } else {
        _.forEach(paths, path => {
          rules.push({
            host: rule.host || '*',
            path: path.path || '*',
            serviceName: path.backend.serviceName,
            servicePort: path.backend.servicePort,
          });
        });
      }
    });

    const rows = _.map(rules, rule => {
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
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: t('COMMON:MSG_LNB_MENU_48') })} />
        <ResourceSummary resource={ingress}>
          <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_42')}</dt>
          <dd>{getTLSCert(ingress)}</dd>
        </ResourceSummary>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_INGRESSRULES_1')} />
        <p className="co-m-pane__explanation">{t('COMMON:MSG_DETAILS_TABDETAILS_INGRESSRULES_2')}</p>
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <RulesHeader />
          <RulesRows spec={ingress.spec} namespace={ingress.metadata.namespace} />
        </div>
      </div>
    </>
  );
};

const IngressesDetailsPage = props => <DetailsPage {...props} menuActions={menuActions} pages={[navFactory.details(detailsPage(Details)), navFactory.editYaml()]} />;
const IngressesList = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Ingresses" Header={IngressTableHeader.bind(null, t)} Row={IngressTableRow} virtualize />;
};

const IngressesPage = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_48')} ListComponent={IngressesList} canCreate={true} {...props} />;
};

export { IngressesList, IngressesPage, IngressesDetailsPage };
