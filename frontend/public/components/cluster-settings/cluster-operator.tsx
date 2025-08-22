import * as React from 'react';
import * as _ from 'lodash-es';
import { css } from '@patternfly/react-styles';
import { useLocation } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { UnknownIcon } from '@patternfly/react-icons/dist/esm/icons/unknown-icon';
import { useTranslation } from 'react-i18next';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ClusterOperatorModel } from '../../models';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from '../factory';
import { Conditions } from '../conditions';
import {
  getClusterOperatorStatus,
  getClusterOperatorVersion,
  getClusterVersionCondition,
  getStatusAndMessage,
  ClusterOperator,
  ClusterVersionConditionType,
  ClusterVersionKind,
  K8sResourceConditionStatus,
  K8sResourceKindReference,
  OperandVersion,
  OperatorStatus,
  referenceForModel,
} from '../../module/k8s';
import {
  navFactory,
  EmptyBox,
  Kebab,
  LinkifyExternal,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
} from '../utils';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import RelatedObjectsPage from './related-objects';
import { ClusterVersionConditionsLink, UpdatingMessageText } from './cluster-status';

export const clusterOperatorReference: K8sResourceKindReference = referenceForModel(
  ClusterOperatorModel,
);

const getIcon = (status: OperatorStatus) => {
  return {
    [OperatorStatus.Available]: <GreenCheckCircleIcon />,
    [OperatorStatus.Progressing]: <SyncAltIcon />,
    [OperatorStatus.Degraded]: <YellowExclamationTriangleIcon />,
    [OperatorStatus.CannotUpdate]: <YellowExclamationTriangleIcon />,
    [OperatorStatus.Unavailable]: <RedExclamationCircleIcon />,
    [OperatorStatus.Unknown]: <UnknownIcon />,
  }[status];
};

const OperatorStatusIconAndLabel: React.FC<OperatorStatusIconAndLabelProps> = ({ status }) => {
  const icon = getIcon(status);
  return (
    <>
      {icon} {status}
    </>
  );
};

const tableColumnClasses = [
  '',
  'pf-v6-u-w-16-on-xl',
  'pf-m-hidden pf-m-visible-on-md pf-v6-u-w-33-on-2xl',
  'pf-m-hidden pf-m-visible-on-md pf-v6-u-w-33-on-2xl',
  Kebab.columnClass,
];

const ClusterOperatorTableRow: React.FC<RowFunctionArgs<ClusterOperator>> = ({ obj }) => {
  const { status, message } = getStatusAndMessage(obj);
  const operatorVersion = getClusterOperatorVersion(obj);
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={clusterOperatorReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <OperatorStatusIconAndLabel status={status} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{operatorVersion || '-'}</TableData>
      <TableData
        className={css(tableColumnClasses[3], 'co-break-word', 'co-line-clamp', 'co-pre-line')}
      >
        <LinkifyExternal>{message || '-'}</LinkifyExternal>
      </TableData>
    </>
  );
};

export const ClusterOperatorList: React.FC = (props) => {
  const { t } = useTranslation();
  const ClusterOperatorTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Status'),
        sortFunc: 'getClusterOperatorStatus',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Version'),
        sortFunc: 'getClusterOperatorVersion',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Message'),
        props: { className: tableColumnClasses[3] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={ClusterOperatorModel.labelPlural}
      Header={ClusterOperatorTableHeader}
      Row={ClusterOperatorTableRow}
      virtualize
    />
  );
};

const UpdateInProgressAlert: React.FC<UpdateInProgressAlertProps> = ({ cv }) => {
  const updateCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.Progressing,
    K8sResourceConditionStatus.True,
  );
  return (
    <>
      {updateCondition && (
        <PaneBody sectionHeading>
          <Alert
            isInline
            className="co-alert"
            variant="info"
            title={<UpdatingMessageText cv={cv} />}
          >
            <ClusterVersionConditionsLink cv={cv} />
          </Alert>
        </PaneBody>
      )}
    </>
  );
};

export const ClusterOperatorPage: React.FC<ClusterOperatorPageProps> = (props) => {
  const { t } = useTranslation();
  const filters = [
    {
      filterGroupName: t('public~Status'),
      type: 'cluster-operator-status',
      reducer: getClusterOperatorStatus,
      items: [
        { id: 'Available', title: t('public~Available') },
        { id: 'Progressing', title: t('public~Progressing') },
        { id: 'Degraded', title: t('public~Degraded') },
        { id: 'Cannot update', title: t('public~Cannot update') },
        { id: 'Unavailable', title: t('public~Unavailable') },
        { id: 'Unknown', title: t('public~Unknown') },
      ],
    },
  ];
  return (
    <>
      <UpdateInProgressAlert cv={props.cv} />
      <ListPage
        {...props}
        title={ClusterOperatorModel.labelPlural}
        kind={clusterOperatorReference}
        ListComponent={ClusterOperatorList}
        canCreate={false}
        rowFilters={filters}
      />
    </>
  );
};

const OperandVersions: React.FC<OperandVersionsProps> = ({ versions }) => {
  const { t } = useTranslation();
  return _.isEmpty(versions) ? (
    <EmptyBox label={t('public~versions')} />
  ) : (
    <div className="co-table-container">
      <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
        <thead className="pf-v6-c-table__thead">
          <tr className="pf-v6-c-table__tr">
            <th className="pf-v6-c-table__th">{t('public~Name')}</th>
            <th className="pf-v6-c-table__th">{t('public~Version')}</th>
          </tr>
        </thead>
        <tbody className="pf-v6-c-table__tbody">
          {_.map(versions, ({ name, version }, i) => (
            <tr className="pf-v6-c-table__tr" key={i}>
              <td className="pf-v6-c-table__td">{name}</td>
              <td className="pf-v6-c-table__td">{version}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ClusterOperatorDetails: React.FC<ClusterOperatorDetailsProps> = ({ obj }) => {
  const { status, message } = getStatusAndMessage(obj);
  const versions: OperandVersion[] = _.get(obj, 'status.versions', []);
  const conditions = _.get(obj, 'status.conditions', []);
  // Show the operator version in the details if it's the only version.
  const operatorVersion =
    versions.length === 1 && versions[0].name === 'operator' ? versions[0].version : null;
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~ClusterOperator details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              {operatorVersion && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('public~Version')}</DescriptionListTerm>
                  <DescriptionListDescription>{operatorVersion}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <OperatorStatusIconAndLabel status={status} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Message')}</DescriptionListTerm>
                <DescriptionListDescription className="co-pre-line">
                  <LinkifyExternal>{message || '-'}</LinkifyExternal>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={conditions} />
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Operand versions')} />
        <OperandVersions versions={versions} />
      </PaneBody>
    </>
  );
};

export const ClusterOperatorDetailsPage: React.FC = (props) => {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <DetailsPage
      {...props}
      kind={clusterOperatorReference}
      pages={[
        navFactory.details(ClusterOperatorDetails),
        navFactory.editYaml(),
        {
          href: 'related-objects',
          // t('public~Related objects')
          nameKey: 'public~Related objects',
          component: RelatedObjectsPage,
        },
      ]}
      breadcrumbsFor={() => [
        {
          name: t(ClusterOperatorModel.labelPluralKey),
          path: '/settings/cluster/clusteroperators',
        },
        {
          name: t('public~ClusterOperator details'),
          path: location.pathname,
        },
      ]}
    />
  );
};

type OperatorStatusIconAndLabelProps = {
  status: OperatorStatus;
};

type ClusterOperatorPageProps = {
  cv: ClusterVersionKind;
  autoFocus?: boolean;
  showTitle?: boolean;
};

type OperandVersionsProps = {
  versions: OperandVersion[];
};

type ClusterOperatorDetailsProps = {
  obj: ClusterOperator;
};

type UpdateInProgressAlertProps = {
  cv: ClusterVersionKind;
};
