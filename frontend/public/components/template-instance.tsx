import * as React from 'react';
import * as _ from 'lodash-es';
import { css } from '@patternfly/react-styles';
import { sortable, Table as PfTable, Th, Thead, Tr, Tbody, Td } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';

import { Status } from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage, RowFunctionArgs, Table, TableData } from './factory';
import { Conditions } from './conditions';
import { getTemplateInstanceStatus, referenceFor, TemplateInstanceKind } from '../module/k8s';
import {
  EmptyBox,
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from './utils';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';

const menuActions = Kebab.factory.common;

const tableColumnClasses = [
  'pf-v6-u-w-42-on-md',
  'pf-v6-u-w-42-on-md',
  'pf-m-hidden pf-m-visible-on-md pf-v6-u-w-16-on-md',
  Kebab.columnClass,
];

const TemplateInstanceTableRow: React.FC<RowFunctionArgs<TemplateInstanceKind>> = ({ obj }) => {
  return (
    <>
      <TableData className={css(tableColumnClasses[0], 'co-break-word')}>
        <ResourceLink
          kind="TemplateInstance"
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={getTemplateInstanceStatus(obj)} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <ResourceKebab actions={menuActions} kind="TemplateInstance" resource={obj} />
      </TableData>
    </>
  );
};

export const TemplateInstanceList: React.FCC = (props) => {
  const { t } = useTranslation();

  const TemplateInstanceTableHeader = () => {
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
      },
      {
        title: t('public~Status'),
        sortFunc: 'getTemplateInstanceStatus',
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
      aria-label={t('public~TemplateInstances')}
      Header={TemplateInstanceTableHeader}
      Row={TemplateInstanceTableRow}
      virtualize
    />
  );
};

const allStatuses = ['Ready', 'Not Ready', 'Failed'];

export const TemplateInstancePage: React.FCC<TemplateInstancePageProps> = (props) => {
  const { t } = useTranslation();

  const filters = [
    {
      filterGroupName: t('public~Status'),
      type: 'template-instance-status',
      reducer: getTemplateInstanceStatus,
      items: _.map(allStatuses, (status) => ({
        id: status,
        title: status,
      })),
    },
  ];

  return (
    <ListPage
      {...props}
      title={t('public~TemplateInstances')}
      kind="TemplateInstance"
      ListComponent={TemplateInstanceList}
      canCreate={false}
      rowFilters={filters}
    />
  );
};

const TemplateInstanceDetails: React.FCC<TemplateInstanceDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const status = getTemplateInstanceStatus(obj);
  const secretName = _.get(obj, 'spec.secret.name');
  const requester = _.get(obj, 'spec.requester.username');
  const objects = _.get(obj, 'status.objects', []);
  const conditions = _.get(obj, 'status.conditions', []);
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~TemplateInstance details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Status status={status} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              {secretName && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Parameters')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ResourceLink
                      kind="Secret"
                      name={secretName}
                      namespace={obj.metadata.namespace}
                    />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Requester')}</DescriptionListTerm>
                <DescriptionListDescription>{requester || '-'}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Objects')} />
        {_.isEmpty(objects) ? (
          <EmptyBox label={t('public~Objects')} />
        ) : (
          <PfTable gridBreakPoint="">
            <Thead>
              <Tr>
                <Th>{t('public~Name')}</Th>
                <Th>{t('public~Namespace')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {_.map(objects, ({ ref }, i) => (
                <Tr key={i}>
                  <Td>
                    <ResourceLink
                      kind={referenceFor(ref)}
                      name={ref.name}
                      namespace={ref.namespace}
                    />
                  </Td>
                  <Td>
                    {ref.namespace ? <ResourceLink kind="Namespace" name={ref.namespace} /> : '-'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </PfTable>
        )}
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={conditions} />
      </PaneBody>
    </>
  );
};

export const TemplateInstanceDetailsPage: React.FCC = (props) => (
  <DetailsPage
    {...props}
    kind="TemplateInstance"
    menuActions={menuActions}
    pages={[navFactory.details(TemplateInstanceDetails), navFactory.editYaml()]}
  />
);

type TemplateInstancePageProps = {
  autoFocus?: boolean;
  showTitle?: boolean;
};

type TemplateInstanceDetailsProps = {
  obj: TemplateInstanceKind;
};
