import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { MachineAutoscalerModel } from '../models';
import {
  groupVersionFor,
  K8sResourceKind,
  referenceForGroupVersionKind,
  referenceForModel,
} from '../module/k8s';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import {
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';

const { common } = Kebab.factory;
const menuActions = [...common];
const machineAutoscalerReference = referenceForModel(MachineAutoscalerModel);

const MachineAutoscalerTargetLink: React.FC<MachineAutoscalerTargetLinkProps> = ({ obj }) => {
  const targetAPIVersion: string = _.get(obj, 'spec.scaleTargetRef.apiVersion');
  const targetKind: string = _.get(obj, 'spec.scaleTargetRef.kind');
  const targetName: string = _.get(obj, 'spec.scaleTargetRef.name');
  if (!targetAPIVersion || !targetKind || !targetName) {
    return <>-</>;
  }

  const groupVersion = groupVersionFor(targetAPIVersion);
  const reference = referenceForGroupVersionKind(groupVersion.group)(groupVersion.version)(
    targetKind,
  );
  return <ResourceLink kind={reference} name={targetName} namespace={obj.metadata.namespace} />;
};

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-sm pf-v6-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-lg pf-v6-u-w-16-on-xl pf-v6-u-w-10-on-2xl',
  'pf-m-hidden pf-m-visible-on-lg pf-v6-u-w-16-on-xl pf-v6-u-w-10-on-2xl',
  Kebab.columnClass,
];

const MachineAutoscalerTableRow: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={machineAutoscalerReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={css(tableColumnClasses[2], 'co-break-word')}>
        <MachineAutoscalerTargetLink obj={obj} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>{_.get(obj, 'spec.minReplicas', '-')}</TableData>
      <TableData className={tableColumnClasses[4]}>
        {_.get(obj, 'spec.maxReplicas') || '-'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={machineAutoscalerReference} resource={obj} />
      </TableData>
    </>
  );
};

const MachineAutoscalerList: React.FC = (props) => {
  const { t } = useTranslation();
  const MachineAutoscalerTableHeader = () => {
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
        title: t('public~Scale target'),
        sortField: 'spec.scaleTargetRef.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Min'),
        sortField: 'spec.minReplicas',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Max'),
        sortField: 'spec.maxReplicas',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
      },
    ];
  };

  return (
    <Table
      {...props}
      aria-label={t('public~Machine autoscalers')}
      Header={MachineAutoscalerTableHeader}
      Row={MachineAutoscalerTableRow}
      virtualize
    />
  );
};

const MachineAutoscalerDetails: React.FC<MachineAutoscalerDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~MachineAutoscaler details')} />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={obj}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Scale target')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <MachineAutoscalerTargetLink obj={obj} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Min replicas')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {_.get(obj, 'spec.minReplicas', '-')}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Max replicas')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {_.get(obj, 'spec.maxReplicas') || '-'}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </ResourceSummary>
          </GridItem>
        </Grid>
      </PaneBody>
    </>
  );
};

export const MachineAutoscalerPage: React.FC<MachineAutoscalerPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={MachineAutoscalerList}
    kind={machineAutoscalerReference}
    canCreate={true}
  />
);

export const MachineAutoscalerDetailsPage: React.FC = (props) => (
  <DetailsPage
    {...props}
    menuActions={menuActions}
    kind={machineAutoscalerReference}
    pages={[navFactory.details(MachineAutoscalerDetails), navFactory.editYaml()]}
  />
);

type MachineAutoscalerPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type MachineAutoscalerTargetLinkProps = {
  obj: K8sResourceKind;
};

export type MachineAutoscalerDetailsProps = {
  obj: K8sResourceKind;
};
