import type { FC } from 'react';
import { useMemo, useCallback, Suspense } from 'react';
import * as _ from 'lodash';
import { useLocation } from 'react-router';
import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { RhUiSyncIcon, RhUiUnknownIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ClusterOperatorModel } from '../../models';
import { DetailsPage, ListPage } from '../factory';
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
import { navFactory } from '../utils/horizontal-nav';
import { EmptyBox, LoadingBox } from '../utils/status-box';
import { LinkifyExternal } from '../utils/link';
import { ResourceLink } from '../utils/resource-link';
import { ResourceSummary } from '../utils/details-page';
import { SectionHeading } from '../utils/headings';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared/src/components/status/icons';
import { DASH } from '@console/shared/src/constants/ui';
import RelatedObjectsPage from './related-objects';
import { ClusterVersionConditionsLink, UpdatingMessageText } from './cluster-status';
import {
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import {
  ResourceFilters,
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
} from '@console/app/src/components/data-view/types';
import type { DataViewFilterOption } from '@patternfly/react-data-view/dist/esm/DataViewFilters';
import { RowProps, TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { sortResourceByValue } from '../factory/Table/sort';
import { sorts } from '../factory/table';

const clusterOperatorReference: K8sResourceKindReference = referenceForModel(ClusterOperatorModel);

const getIcon = (status: OperatorStatus) => {
  return {
    [OperatorStatus.Available]: <GreenCheckCircleIcon />,
    [OperatorStatus.Progressing]: <RhUiSyncIcon />,
    [OperatorStatus.Degraded]: <YellowExclamationTriangleIcon />,
    [OperatorStatus.CannotUpdate]: <YellowExclamationTriangleIcon />,
    [OperatorStatus.Unavailable]: <RedExclamationCircleIcon />,
    [OperatorStatus.Unknown]: <RhUiUnknownIcon />,
  }[status];
};

const OperatorStatusIconAndLabel: FC<OperatorStatusIconAndLabelProps> = ({ status }) => {
  const icon = getIcon(status);
  return (
    <>
      {icon} {status}
    </>
  );
};

const tableColumnInfo = [{ id: 'name' }, { id: 'status' }, { id: 'version' }, { id: 'message' }];

const getClusterOperatorDataViewRows = (
  rowData: RowProps<ClusterOperator, ClusterOperatorRowData>[],
  tableColumns: ConsoleDataViewColumn<ClusterOperator>[],
): ConsoleDataViewRow[] => {
  return rowData.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const { status, message } = getStatusAndMessage(obj);
    const operatorVersion = getClusterOperatorVersion(obj);

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={clusterOperatorReference} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <OperatorStatusIconAndLabel status={status} />,
      },
      [tableColumnInfo[2].id]: {
        cell: operatorVersion || DASH,
      },
      [tableColumnInfo[3].id]: {
        cell: (
          <div className="co-break-word co-line-clamp co-pre-line">
            <LinkifyExternal>{message || DASH}</LinkifyExternal>
          </div>
        ),
      },
    };

    return tableColumns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const useClusterOperatorColumns = (): TableColumn<ClusterOperator>[] => {
  const { t } = useTranslation('public');
  const columns = useMemo(() => {
    return [
      {
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: t('Status'),
        id: tableColumnInfo[1].id,
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue<ClusterOperator>(direction, sorts.getClusterOperatorStatus),
          ),
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: t('Version'),
        id: tableColumnInfo[2].id,
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue<ClusterOperator>(direction, sorts.getClusterOperatorVersion),
          ),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('Message'),
        id: tableColumnInfo[3].id,
        props: {
          modifier: 'nowrap',
        },
      },
    ];
  }, [t]);
  return columns;
};

const ClusterOperatorList: FC<ClusterOperatorListProps> = ({ data, loaded, ...props }) => {
  const { t } = useTranslation('public');
  const columns = useClusterOperatorColumns();

  const clusterOperatorStatusFilterOptions = useMemo<DataViewFilterOption[]>(() => {
    return [
      {
        value: 'Available',
        label: t('Available'),
      },
      {
        value: 'Progressing',
        label: t('Progressing'),
      },
      {
        value: 'Degraded',
        label: t('Degraded'),
      },
      {
        value: 'Cannot update',
        label: t('Cannot update'),
      },
      {
        value: 'Unavailable',
        label: t('Unavailable'),
      },
      {
        value: 'Unknown',
        label: t('Unknown'),
      },
    ];
  }, [t]);

  const initialFilters = useMemo(() => ({ ...initialFiltersDefault, status: [] }), []);

  const additionalFilterNodes = useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="status"
        filterId="status"
        title={t('Status')}
        placeholder={t('Filter by status')}
        options={clusterOperatorStatusFilterOptions}
      />,
    ],
    [t, clusterOperatorStatusFilterOptions],
  );

  const matchesAdditionalFilters = useCallback(
    (resource: ClusterOperator, filters: ClusterOperatorFilters) =>
      filters.status.length === 0 || filters.status.includes(getClusterOperatorStatus(resource)),
    [],
  );

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<ClusterOperator, ClusterOperatorRowData, ClusterOperatorFilters>
        {...props}
        label={ClusterOperatorModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFilters}
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
        getDataViewRows={getClusterOperatorDataViewRows}
        hideColumnManagement={true}
      />
    </Suspense>
  );
};

const UpdateInProgressAlert: FC<UpdateInProgressAlertProps> = ({ cv }) => {
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

export const ClusterOperatorPage: FC<ClusterOperatorPageProps> = (props) => {
  return (
    <>
      <UpdateInProgressAlert cv={props.cv} />
      <ListPage
        {...props}
        title={ClusterOperatorModel.labelPlural}
        kind={clusterOperatorReference}
        ListComponent={ClusterOperatorList}
        canCreate={false}
        omitFilterToolbar={true}
      />
    </>
  );
};

const OperandVersions: FC<OperandVersionsProps> = ({ versions }) => {
  const { t } = useTranslation('public');
  return _.isEmpty(versions) ? (
    <EmptyBox label={t('versions')} />
  ) : (
    <div className="co-table-container">
      <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
        <thead className="pf-v6-c-table__thead">
          <tr className="pf-v6-c-table__tr">
            <th className="pf-v6-c-table__th">{t('Name')}</th>
            <th className="pf-v6-c-table__th">{t('Version')}</th>
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

const ClusterOperatorDetails: FC<ClusterOperatorDetailsProps> = ({ obj }) => {
  const { status, message } = getStatusAndMessage(obj);
  const versions: OperandVersion[] = _.get(obj, 'status.versions', []);
  const conditions = _.get(obj, 'status.conditions', []);
  // Show the operator version in the details if it's the only version.
  const operatorVersion =
    versions.length === 1 && versions[0].name === 'operator' ? versions[0].version : null;
  const { t } = useTranslation('public');
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('ClusterOperator details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={obj} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
              {operatorVersion && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Version')}</DescriptionListTerm>
                  <DescriptionListDescription>{operatorVersion}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <OperatorStatusIconAndLabel status={status} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Message')}</DescriptionListTerm>
                <DescriptionListDescription className="co-pre-line">
                  <LinkifyExternal>{message || '-'}</LinkifyExternal>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('Conditions')} />
        <Conditions conditions={conditions} />
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('Operand versions')} />
        <OperandVersions versions={versions} />
      </PaneBody>
    </>
  );
};

export const ClusterOperatorDetailsPage: FC = (props) => {
  const { t } = useTranslation('public');
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
          name: t('ClusterOperator details'),
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

type ClusterOperatorFilters = ResourceFilters & { status: string[] };

type ClusterOperatorRowData = {
  obj: ClusterOperator;
};

type ClusterOperatorListProps = {
  data: ClusterOperator[];
  loaded: boolean;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
};
