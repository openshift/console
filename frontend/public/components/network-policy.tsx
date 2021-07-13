import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { connectToFlags } from '../reducers/connectToFlags';
import { FlagsObject } from '../reducers/features';
import { BlueInfoCircleIcon, FLAGS } from '@console/shared';
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
import {
  NetworkPolicyKind,
  NetworkPolicyPort,
  NetworkPolicyPeer,
  Selector as K8SSelector,
} from '../module/k8s';
import { Tooltip } from '@patternfly/react-core';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(NetworkPolicyModel), ...common];

const tableColumnClasses = ['', '', 'pf-m-hidden pf-m-visible-on-md', Kebab.columnClass];

const kind = 'NetworkPolicy';

type NetworkPolicyTableRowProps = {
  obj: NetworkPolicyKind;
  index: number;
  key: string;
  style: object;
};

const NetworkPolicyTableRow: React.FunctionComponent<NetworkPolicyTableRowProps> = ({
  obj: np,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={np.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={np.metadata.name} namespace={np.metadata.namespace} />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind={'Namespace'} name={np.metadata.namespace} />
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
        title: t('public~Pod selector'),
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
      aria-label={t('public~NetworkPolicies')}
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
      <div className="col-xs-4">{t('public~Target pods')}</div>
      <div className="col-xs-5">{t('public~From')}</div>
      <div className="col-xs-3">{t('public~To ports')}</div>
    </div>
  );
};

const EgressHeader = () => {
  const { t } = useTranslation();
  return (
    <div className="row co-m-table-grid__head">
      <div className="col-xs-4">{t('public~From pods')}</div>
      <div className="col-xs-5">{t('public~To')}</div>
      <div className="col-xs-3">{t('public~To ports')}</div>
    </div>
  );
};

type ConsolidatedRow = Omit<NetworkPolicyPeer, 'ipBlock'> & {
  ipBlocks?: {
    cidr: string;
    except?: string[];
  }[];
};

const consolidatePeers = (peers?: NetworkPolicyPeer[]): ConsolidatedRow[] => {
  // Consolidate peers as one row per peer, except ipblock peers which are merged into a single row
  if (!peers) {
    return [{}]; // stands for "any peer"
  }
  const ipBlocks = peers.filter((p) => !!p.ipBlock).map((p) => p.ipBlock);
  const consolidated = peers.filter((p) => !p.ipBlock) as ConsolidatedRow[];
  if (ipBlocks.length > 0) {
    consolidated.push({ ipBlocks });
  }
  return consolidated;
};

type PeerRowProps = {
  row: ConsolidatedRow;
  ports: NetworkPolicyPort[];
  namespace: string;
  mainPodSelector: K8SSelector;
};

const PeerRow: React.FunctionComponent<PeerRowProps> = ({
  row,
  ports,
  namespace,
  mainPodSelector,
}) => {
  const { t } = useTranslation();
  const style = { margin: '5px 0' };

  return (
    <div className="row co-resource-list__item">
      <div className="col-xs-4">
        <div>
          <span className="text-muted">{t('public~Pod selector')}:</span>
        </div>
        <div style={style}>
          {_.isEmpty(mainPodSelector) ? (
            <Link to={`/search/ns/${namespace}?kind=Pod`}>{`All pods within ${namespace}`}</Link>
          ) : (
            <Selector selector={mainPodSelector} namespace={namespace} />
          )}
        </div>
      </div>
      <div className="col-xs-5">
        <div>
          {!row.namespaceSelector && !row.podSelector && !row.ipBlocks ? (
            <div>{t('public~Any peer')}</div>
          ) : (
            <>
              {row.namespaceSelector ? (
                <div>
                  <span className="text-muted">{t('public~NS selector')}:</span>
                  <div style={style}>
                    {_.isEmpty(row.namespaceSelector) ? (
                      <span>{t('public~Any namespace')}</span>
                    ) : (
                      <Selector selector={row.namespaceSelector} kind="Namespace" />
                    )}
                  </div>
                </div>
              ) : (
                row.podSelector && (
                  <div>
                    <span className="text-muted">{t('public~Namespace')}:</span>
                    <div style={style}>{namespace}</div>
                  </div>
                )
              )}
              {row.podSelector && (
                <div style={{ paddingTop: 10 }}>
                  <span className="text-muted">{t('public~Pod selector')}:</span>
                  <div style={style}>
                    {_.isEmpty(row.podSelector) ? (
                      <span>{t('public~Any pod')}</span>
                    ) : (
                      <Selector
                        selector={row.podSelector}
                        namespace={row.namespaceSelector ? undefined : namespace}
                      />
                    )}
                  </div>
                </div>
              )}
              {row.ipBlocks && (
                <div>
                  <span className="text-muted">{t('public~IP blocks')}:</span>
                  {row.ipBlocks.map((ipblock, idx) => (
                    <div style={style} key={`ipblock_${idx}`}>
                      {ipblock.cidr}
                      {ipblock.except && ipblock.except.length > 0 && (
                        <>
                          <Tooltip
                            content={
                              <div>
                                {t('public~Exceptions')}
                                {': '}
                                {ipblock.except.join(', ')}
                              </div>
                            }
                          >
                            <span>
                              {` (${t('public~with exceptions')}) `}
                              <BlueInfoCircleIcon />
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="col-xs-3">
        {ports && ports.length > 0 ? (
          <>
            {_.map(ports, (port, k) => (
              <p key={k}>
                {port.protocol}/{port.port}
              </p>
            ))}
          </>
        ) : (
          <div>{t('public~Any port')}</div>
        )}
      </div>
    </div>
  );
};

type DetailsProps = {
  obj: NetworkPolicyKind;
  flags: FlagsObject;
};

const Details_: React.FunctionComponent<DetailsProps> = ({ obj: np, flags }) => {
  const { t } = useTranslation();
  // Note, the logic differs between ingress and egress, see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.21/#networkpolicyspec-v1-networking-k8s-io
  // A policy affects egress if it is explicitely specified in policyTypes, or if policyTypes isn't set and there is an egress section.
  // A policy affects ingress if it is explicitely specified in policyTypes, or if policyTypes isn't set, regardless the presence of an ingress sections.
  const explicitPolicyTypes = !!np.spec.policyTypes;
  const affectsEgress = explicitPolicyTypes
    ? np.spec.policyTypes.includes('Egress')
    : !!np.spec.egress;
  const affectsIngress = explicitPolicyTypes ? np.spec.policyTypes.includes('Ingress') : true;
  const egressDenied = affectsEgress && (!np.spec.egress || np.spec.egress.length === 0);
  const ingressDenied = affectsIngress && (!np.spec.ingress || np.spec.ingress.length === 0);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Network policy details')} />
        <div className="row">
          <div className="col-md-6">
            <ResourceSummary resource={np} podSelector={'spec.podSelector'} showPodSelector />
          </div>
        </div>
      </div>
      {affectsIngress && (
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Ingress rules')} />
          <p className="co-m-pane__explanation">
            <Trans ns="public">
              Pods accept all traffic by default. They can be isolated via NetworkPolicies which
              specify a whitelist of ingress rules. When a Pod is selected by a NetworkPolicy, it
              will reject all traffic not explicitly allowed via a NetworkPolicy. See more details
              in:{' '}
              <ExternalLink
                href={getNetworkPolicyDocLink(flags[FLAGS.OPENSHIFT])}
                text={t('public~NetworkPolicies documentation')}
              />
              .
            </Trans>
          </p>
          {ingressDenied ? (
            t('public~All incoming traffic is denied to Pods in {{namespace}}', {
              namespace: np.metadata.namespace,
            })
          ) : (
            <div className="co-m-table-grid co-m-table-grid--bordered">
              <IngressHeader />
              <div className="co-m-table-grid__body">
                {_.map(np.spec.ingress, (rule, i) =>
                  consolidatePeers(rule.from).map((row, j) => (
                    <PeerRow
                      key={`${i}_${j}`}
                      row={row}
                      ports={rule.ports}
                      mainPodSelector={np.spec.podSelector}
                      namespace={np.metadata.namespace}
                    />
                  )),
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {affectsEgress && (
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Egress rules')} />
          <p className="co-m-pane__explanation">
            <Trans ns="public">
              All outgoing traffic is allowed by default. Egress rules can be used to restrict
              outgoing traffic if the cluster network provider allows it. When using the OpenShift
              SDN cluster network provider, egress network policy is not supported. See more details
              in:{' '}
              <ExternalLink
                href={getNetworkPolicyDocLink(flags[FLAGS.OPENSHIFT])}
                text={t('public~NetworkPolicies documentation')}
              />
              .
            </Trans>
          </p>
          {egressDenied ? (
            t('public~All outgoing traffic is denied from Pods in {{namespace}}', {
              namespace: np.metadata.namespace,
            })
          ) : (
            <div className="co-m-table-grid co-m-table-grid--bordered">
              <EgressHeader />
              <div className="co-m-table-grid__body">
                {_.map(np.spec.egress, (rule, i) =>
                  consolidatePeers(rule.to).map((row, j) => (
                    <PeerRow
                      key={`${i}_${j}`}
                      row={row}
                      ports={rule.ports}
                      mainPodSelector={np.spec.podSelector}
                      namespace={np.metadata.namespace}
                    />
                  )),
                )}
              </div>
            </div>
          )}
        </div>
      )}
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
