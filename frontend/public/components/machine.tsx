import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  getMachineAddresses,
  getMachineInstanceType,
  getMachineNodeName,
  getMachineRegion,
  getMachineRole,
  getMachineZone,
  Status,
  getMachinePhase,
} from '@console/shared';
import { MachineModel } from '../models';
import { MachineKind, referenceForModel } from '../module/k8s';
import { Conditions } from './conditions';
import NodeIPList from '@console/app/src/components/nodes/NodeIPList';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  DetailsItem,
  Kebab,
  NodeLink,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from './utils';
import { ResourceEventStream } from './events';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(MachineModel), ...common];
export const machineReference = referenceForModel(MachineModel);

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-md'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const getMachineProviderState = (obj: MachineKind): string =>
  obj?.status?.providerStatus?.instanceState;

const MachineTableRow: RowFunction<MachineKind> = ({ obj, index, key, style }) => {
  const nodeName = getMachineNodeName(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);
  const providerState = getMachineProviderState(obj);
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={classNames(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink
          kind={machineReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {nodeName ? <NodeLink name={nodeName} /> : '-'}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Status status={getMachinePhase(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{providerState ?? '-'}</TableData>
      <TableData className={tableColumnClasses[5]}>{region || '-'}</TableData>
      <TableData className={tableColumnClasses[6]}>{zone || '-'}</TableData>
      <TableData className={tableColumnClasses[7]}>
        <ResourceKebab actions={menuActions} kind={machineReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const MachineDetails: React.SFC<MachineDetailsProps> = ({ obj }: { obj: MachineKind }) => {
  const nodeName = getMachineNodeName(obj);
  const machineRole = getMachineRole(obj);
  const instanceType = getMachineInstanceType(obj);
  const region = getMachineRegion(obj);
  const zone = getMachineZone(obj);
  const providerState = getMachineProviderState(obj);
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Machine details')} />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={obj} />
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <DetailsItem label={t('public~Phase')} obj={obj} path="status.phase">
                  <Status status={getMachinePhase(obj)} />
                </DetailsItem>
                <DetailsItem
                  label={t('public~Provider state')}
                  obj={obj}
                  path="status.providerStatus.instanceState"
                >
                  {providerState}
                </DetailsItem>
                {nodeName && (
                  <>
                    <dt>{t('public~Node')}</dt>
                    <dd>
                      <NodeLink name={nodeName} />
                    </dd>
                  </>
                )}
                {machineRole && (
                  <>
                    <dt>{t('public~Machine role')}</dt>
                    <dd>{machineRole}</dd>
                  </>
                )}
                {instanceType && (
                  <>
                    <dt>{t('public~Instance type')}</dt>
                    <dd>{instanceType}</dd>
                  </>
                )}
                {region && (
                  <>
                    <dt>{t('public~Region')}</dt>
                    <dd>{region}</dd>
                  </>
                )}
                {zone && (
                  <>
                    <dt>{t('public~Availability zone')}</dt>
                    <dd>{zone}</dd>
                  </>
                )}
                <dt>{t('public~Machine addresses')}</dt>
                <dd>
                  <NodeIPList ips={getMachineAddresses(obj)} expand />
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={obj.status?.providerStatus?.conditions} />
      </div>
    </>
  );
};

export const MachineList: React.SFC = (props) => {
  const { t } = useTranslation();
  const MachineTableHeader = () => {
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
        title: t('public~Node'),
        sortField: 'status.nodeRef.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Phase'),
        sortFunc: 'machinePhase',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Provider state'),
        sortField: 'status.providerStatus.instanceState',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('public~Region'),
        sortField: "metadata.labels['machine.openshift.io/region']",
        transforms: [sortable],
        props: { className: tableColumnClasses[5] },
      },
      {
        title: t('public~Availability zone'),
        sortField: "metadata.labels['machine.openshift.io/zone']",
        transforms: [sortable],
        props: { className: tableColumnClasses[6] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[7] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={t('public~Machines')}
      Header={MachineTableHeader}
      Row={MachineTableRow}
      virtualize
    />
  );
};

export const MachinePage: React.SFC<MachinePageProps> = (props) => {
  const { t } = useTranslation();

  return (
    <ListPage
      {...props}
      ListComponent={MachineList}
      kind={machineReference}
      textFilter="machine"
      filterLabel={t('public~by machine or node name')}
      canCreate
    />
  );
};

export const MachineDetailsPage: React.SFC<MachineDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={machineReference}
    menuActions={menuActions}
    pages={[
      navFactory.details(MachineDetails),
      navFactory.editYaml(),
      navFactory.events(ResourceEventStream),
    ]}
    getResourceStatus={getMachinePhase}
  />
);

export type MachineDetailsProps = {
  obj: MachineKind;
};

export type MachinePageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

export type MachineDetailsPageProps = {
  match: any;
};
