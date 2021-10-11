import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Alert } from '@patternfly/react-core';
import { SyncAltIcon, UnknownIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

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
import { ClusterVersionConditionsLink, UpdatingMessageText } from './cluster-settings';

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
  'pf-u-w-16-on-xl',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-33-on-2xl',
  'pf-m-hidden pf-m-visible-on-md pf-u-w-33-on-2xl',
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
        className={classNames(
          tableColumnClasses[3],
          'co-break-word',
          'co-line-clamp',
          'co-pre-line',
        )}
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

const allStatuses = [
  OperatorStatus.Available,
  OperatorStatus.Progressing,
  OperatorStatus.Degraded,
  OperatorStatus.CannotUpdate,
  OperatorStatus.Unknown,
];

const UpdateInProgressAlert: React.FC<UpdateInProgressAlertProps> = ({ cv }) => {
  const updateCondition = getClusterVersionCondition(
    cv,
    ClusterVersionConditionType.Progressing,
    K8sResourceConditionStatus.True,
  );
  return (
    <>
      {updateCondition && (
        <div className="co-m-pane__body co-m-pane__body--section-heading">
          <Alert
            isInline
            className="co-alert"
            variant="info"
            title={<UpdatingMessageText cv={cv} />}
          >
            <ClusterVersionConditionsLink cv={cv} />
          </Alert>
        </div>
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
      items: _.map(allStatuses, (phase) => ({
        id: phase,
        title: phase,
      })),
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
      <table className="table">
        <thead>
          <tr>
            <th>{t('public~Name')}</th>
            <th>{t('public~Version')}</th>
          </tr>
        </thead>
        <tbody>
          {_.map(versions, ({ name, version }, i) => (
            <tr key={i}>
              <td>{name}</td>
              <td>{version}</td>
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
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~ClusterOperator details')} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} />
          </div>
          <div className="col-sm-6">
            <dl>
              {operatorVersion && (
                <>
                  <dt>{t('public~Version')}</dt>
                  <dd>{operatorVersion}</dd>
                </>
              )}
              <dt>{t('public~Status')}</dt>
              <dd>
                <OperatorStatusIconAndLabel status={status} />
              </dd>
              <dt>{t('public~Message')}</dt>
              <dd className="co-pre-line">
                <LinkifyExternal>{message || '-'}</LinkifyExternal>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={conditions} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Operand versions')} />
        <OperandVersions versions={versions} />
      </div>
    </>
  );
};

export const ClusterOperatorDetailsPage: React.FC<ClusterOperatorDetailsPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <DetailsPage
      {...props}
      kind={clusterOperatorReference}
      pages={[
        navFactory.details(ClusterOperatorDetails),
        navFactory.editYaml(),
        {
          href: 'related-objects',
          name: t('public~Related objects'),
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
          path: props.match.url,
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

type ClusterOperatorDetailsPageProps = {
  match: any;
};

type UpdateInProgressAlertProps = {
  cv: ClusterVersionKind;
};
