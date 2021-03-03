import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { DetailsItem, Kebab, LabelList, ResourceIcon, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading, Selector, navFactory } from './utils';
import { ServiceModel } from '../models';
import { useTranslation } from 'react-i18next';

const menuActions = [Kebab.factory.ModifyPodSelector, ...Kebab.getExtensionsActionsForKind(ServiceModel), ...Kebab.factory.common];

const ServiceIP = ({ s }) => {
  const children = _.map(s.spec.ports, (portObj, i) => {
    const clusterIP = s.spec.clusterIP === 'None' ? 'None' : `${s.spec.clusterIP}:${portObj.port}`;
    return (
      <div key={i} className="co-truncate co-select-to-copy">
        {clusterIP}
      </div>
    );
  });

  return children;
};

const kind = 'Service';

const tableColumnClasses = [classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'col-xs-6'), classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'), classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'hidden-xs'), classNames('col-lg-2', 'col-md-3', 'hidden-sm', 'hidden-xs'), classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'), Kebab.columnClass];

const ServiceTableHeader = t => {
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
      title: t('COMMON:MSG_MAIN_TABLEHEADER_16'),
      sortField: 'spec.selector',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('COMMON:MSG_MAIN_TABLEHEADER_27'),
      sortField: 'spec.clusterIP',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
ServiceTableHeader.displayName = 'ServiceTableHeader';

const ServiceTableRow = ({ obj: s, index, key, style }) => {
  return (
    <TableRow id={s.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={s.metadata.name} namespace={s.metadata.namespace} title={s.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={s.metadata.namespace} title={s.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={s.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Selector selector={s.spec.selector} namespace={s.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ServiceIP s={s} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={s} />
      </TableData>
    </TableRow>
  );
};

const ServiceAddress = ({ s }) => {
  const { t } = useTranslation();
  const ServiceIPsRow = (name, desc, ips, note = null) => (
    <div className="co-ip-row">
      <div className="row">
        <div className="col-xs-6">
          <p className="ip-name">{name}</p>
          <p className="ip-desc">{desc}</p>
        </div>
        <div className="col-xs-6">
          {note && <span className="text-muted">{note}</span>}
          {ips.join(', ')}
        </div>
      </div>
    </div>
  );

  const ServiceType = type => {
    switch (type) {
      case 'NodePort':
        return ServiceIPsRow(t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_10'), t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_11'), _.map(s.spec.ports, 'nodePort'), '(all nodes): ');
      case 'LoadBalancer':
        return ServiceIPsRow(
          t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_12'),
          t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_13'),
          _.map(s.status.loadBalancer.ingress, i => i.hostname || i.ip || '-'),
        );
      case 'ExternalName':
        return ServiceIPsRow(t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_14'), t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_15'), [s.spec.externalName]);
      default:
        return ServiceIPsRow(t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_16'), t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_17'), [s.spec.clusterIP]);
    }
  };

  return (
    <div>
      <div className="row co-ip-header">
        <div className="col-xs-6">{t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_3')}</div>
        <div className="col-xs-6">{t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_4')}</div>
      </div>
      <div className="rows">
        {ServiceType(s.spec.type)}
        {s.spec.externalIPs && ServiceIPsRow('External IP', 'IP Address(es) accepting traffic for service', s.spec.externalIPs)}
      </div>
    </div>
  );
};

const ServicePortMapping = ({ ports }) => {
  const { t } = useTranslation();
  return (
    <div>
      <div className="row co-ip-header">
        <div className="col-xs-3">{t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_6')}</div>
        <div className="col-xs-3">{t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_7')}</div>
        <div className="col-xs-3">{t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_8')}</div>
        <div className="col-xs-3">{t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_9')}</div>
      </div>
      <div className="rows">
        {ports.map((portObj, i) => {
          return (
            <div className="co-ip-row" key={i}>
              <div className="row">
                <div className="col-xs-3 co-text-service">
                  <p>{portObj.name || '-'}</p>
                  {portObj.nodePort && <p className="co-text-node">Node Port</p>}
                </div>
                <div className="col-xs-3 co-text-service">
                  <p>
                    <ResourceIcon kind="Service" />
                    <span>{portObj.port}</span>
                  </p>
                  {portObj.nodePort && (
                    <p className="co-text-node">
                      <ResourceIcon kind="Node" />
                      <span>{portObj.nodePort}</span>
                    </p>
                  )}
                </div>
                <div className="col-xs-3">
                  <p>{portObj.protocol}</p>
                </div>
                <div className="col-xs-3 co-text-pod">
                  <p>
                    <ResourceIcon kind="Pod" />
                    <span>{portObj.targetPort}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Details = ({ obj: s }) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-sm-6">
          <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_1', { 0: t('COMMON:MSG_LNB_MENU_47') })} />
          <ResourceSummary resource={s} showPodSelector>
            <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_40')} obj={s} path="spec.sessionAffinity" />
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <SectionHeading text={t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_1')} />
          <dl>
            <dt>{t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_2')}</dt>
            <dd className="service-ips">
              <ServiceAddress s={s} />
            </dd>
            <DetailsItem label={t('SINGLE:MSG_SERVICES_SERVICESDETAILS_TABDETAILS_SERVICEROUTING_5')} obj={s} path="spec.ports">
              <div className="service-ips">{s.spec.ports ? <ServicePortMapping ports={s.spec.ports} /> : '-'}</div>
            </DetailsItem>
          </dl>
        </div>
      </div>
    </div>
  );
};

const { details, pods, editYaml } = navFactory;
const ServicesDetailsPage = props => <DetailsPage {...props} menuActions={menuActions} pages={[details(Details), editYaml(), pods()]} />;

const ServicesList = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Services" Header={ServiceTableHeader.bind(null, t)} Row={ServiceTableRow} virtualize />;
};
const ServicesPage = props => {
  const { t } = useTranslation();
  return <ListPage title={t('COMMON:MSG_LNB_MENU_47')} canCreate={true} ListComponent={ServicesList} {...props} />;
};

export { ServicesList, ServicesPage, ServicesDetailsPage };
