import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { connectToFlags } from '../reducers/features';
import { FLAGS } from '@console/shared';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  Kebab,
  navFactory,
  ResourceKebab,
  SectionHeading,
  ResourceLink,
  ResourceSummary,
  Selector,
  ExternalLink,
} from './utils';
import { NetworkPolicyModel } from '../models';
import { getNetworkPolicyDocLink } from './utils/documentation';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(NetworkPolicyModel), ...common];

const tableColumnClasses = [
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

const kind = 'NetworkPolicy';

const NetworkPolicyTableRow = ({ obj: np, index, key, style }) => {
  return (
    <TableRow id={np.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={np.metadata.name}
          namespace={np.metadata.namespace}
          title={np.metadata.name}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink
          kind={'Namespace'}
          name={np.metadata.namespace}
          title={np.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        {_.isEmpty(np.spec.podSelector) ? (
          <Link
            to={`/search/ns/${np.metadata.namespace}?kind=Pod`}
          >{`All pods within ${np.metadata.namespace}`}</Link>
        ) : (
          <Selector selector={np.spec.podSelector} namespace={np.metadata.namespace} />
        )}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={np} />
      </TableData>
    </TableRow>
  );
};

const NetworkPoliciesList = (props) => {
  const { t } = useTranslation();
  const NetworkPolicyTableHeader = () => {
    return [
      {
        title: t('network-policy~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('network-policy~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('network-policy~Pod selector'),
        sortField: 'spec.podSelector',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={t('network-policy~Network policies')}
      Header={NetworkPolicyTableHeader}
      Row={NetworkPolicyTableRow}
      virtualize
    />
  );
};

export const NetworkPoliciesPage = (props) => (
  <ListPage {...props} ListComponent={NetworkPoliciesList} kind={kind} canCreate={true} />
);

const IngressHeader = () => {
  const { t } = useTranslation();
  return (
    <div className="row co-m-table-grid__head">
      <div className="col-xs-4">{t('network-policy~Target pods')}</div>
      <div className="col-xs-5">{t('network-policy~From')}</div>
      <div className="col-xs-3">{t('network-policy~To ports')}</div>
    </div>
  );
};

const IngressRow = ({ ingress, namespace, podSelector }) => {
  const { t } = useTranslation();
  const podSelectors = [];
  const nsSelectors = [];
  let i = 0;

  const style = { margin: '5px 0' };
  _.each(ingress.from, ({ namespaceSelector, podSelector: ps }) => {
    if (namespaceSelector) {
      nsSelectors.push(
        <div key={i++} style={style}>
          <Selector selector={namespaceSelector} kind="Namespace" />
        </div>,
      );
    } else {
      podSelectors.push(
        <div key={i++} style={style}>
          <Selector selector={ps} namespace={namespace} />
        </div>,
      );
    }
  });
  return (
    <div className="row co-resource-list__item">
      <div className="col-xs-4">
        <div>
          <span className="text-muted">{t('network-policy~Pod selector')}:</span>
        </div>
        <div style={style}>
          <Selector selector={podSelector} namespace={namespace} />
        </div>
      </div>
      <div className="col-xs-5">
        <div>
          {!podSelectors.length ? null : (
            <div>
              <span className="text-muted">{t('network-policy~Pod selector')}:</span>
              {podSelectors}
            </div>
          )}
          {!nsSelectors.length ? null : (
            <div style={{ paddingTop: podSelectors.length ? 10 : 0 }}>
              <span className="text-muted">{t('network-policy~NS selector')}:</span>
              {nsSelectors}
            </div>
          )}
        </div>
      </div>
      <div className="col-xs-3">
        {_.map(ingress.ports, (port, k) => (
          <p key={k}>
            {port.protocol}/{port.port}
          </p>
        ))}
      </div>
    </div>
  );
};

const Details_ = ({ obj: np, flags }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('network-policy~Network policy details')} />
        <ResourceSummary resource={np} podSelector={'spec.podSelector'} showPodSelector />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('network-policy~Ingress rules')} />
        <p className="co-m-pane__explanation">
          {t(
            'network-policy~Pods accept all traffic by default. They can be isolated via Network Policies which specify a whitelist of ingress rules. When a Pod is selected by a Network Policy, it will reject all traffic not explicitly allowed via a Network Policy. See more details in:',
          )}
          <ExternalLink
            href={getNetworkPolicyDocLink(flags[FLAGS.OPENSHIFT])}
            text={t('network-policy~Network Policies documentation')}
          />
          .
        </p>
        {_.isEmpty(_.get(np, 'spec.ingress[0]', [])) ? (
          t('network-policy~All traffic is allowed to Pods in {{namespace}}', {
            namespace: np.metadata.namespace,
          })
        ) : (
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <IngressHeader />
            <div className="co-m-table-grid__body">
              {_.map(np.spec.ingress, (ingress, i) => (
                <IngressRow
                  key={i}
                  ingress={ingress}
                  podSelector={np.spec.podSelector}
                  namespace={np.metadata.namespace}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const Details = connectToFlags(FLAGS.OPENSHIFT)(Details_);

export const NetworkPoliciesDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    pages={[navFactory.details(Details), navFactory.editYaml()]}
  />
);
