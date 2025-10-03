/* eslint-disable camelcase, tsdoc/syntax */
import * as React from 'react';
import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';
import { NavBar } from '@console/internal/components/utils';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { Link, useNavigate, useSearchParams } from 'react-router-dom-v5-compat';
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Label as PfLabel,
  LabelGroup as PfLabelGroup,
  Grid,
  GridItem,
  ButtonVariant,
  Pagination,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useTranslation } from 'react-i18next';

import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { breadcrumbsForGlobalConfig } from '../../cluster-settings/global-config';

import { K8sResourceKind } from '../../../module/k8s';
import { createAlertRoutingModal } from '../../modals';
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  DataViewTextFilter,
  DataViewState,
  useDataViewPagination,
  DataViewTr,
  useDataViewFilters,
  useDataViewSort,
} from '@patternfly/react-data-view';
import { InnerScrollContainer } from '@patternfly/react-table';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';

import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { Firehose, Kebab, SectionHeading, StatusBox } from '../../utils';
import {
  getAlertmanagerConfig,
  patchAlertmanagerConfig,
  receiverTypes,
} from './alertmanager-utils';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  BodyLoading,
  BodyEmpty,
} from '@console/app/src/components/data-view/ResourceDataView';

export enum InitialReceivers {
  Critical = 'Critical',
  Default = 'Default',
  Watchdog = 'Watchdog',
}

interface AlertRoutingProps {
  // alertmanager-main Secret which holds alertmanager configuration yaml
  secret: K8sResourceKind;
  // alertmanager configuration yaml as object
  config: AlertmanagerConfig;
}

const AlertRouting = ({ secret, config }: AlertRoutingProps) => {
  const groupBy = _.get(config, ['route', 'group_by'], []);
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('public~Alert routing')}>
        <Button
          onClick={() => createAlertRoutingModal({ config, secret })}
          variant="secondary"
          data-test="edit-alert-routing-btn"
        >
          {t('public~Edit')}
        </Button>
      </SectionHeading>
      <Grid hasGutter>
        <GridItem sm={6}>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Group by')}</DescriptionListTerm>
              <DescriptionListDescription data-test="group_by_value">
                {_.isEmpty(groupBy) ? '-' : _.join(groupBy, ', ')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Group wait')}</DescriptionListTerm>
              <DescriptionListDescription data-test="group_wait_value">
                {_.get(config, ['route', 'group_wait'], '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>
        <GridItem sm={6}>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Group interval')}</DescriptionListTerm>
              <DescriptionListDescription data-test="group_interval_value">
                {_.get(config, ['route', 'group_interval'], '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Repeat interval')}</DescriptionListTerm>
              <DescriptionListDescription data-test="repeat_interval_value">
                {_.get(config, ['route', 'repeat_interval'], '-')}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

const getIntegrationTypes = (receiver: AlertmanagerReceiver): string[] => {
  /* Given receiver = {
       "name": "team-X-pager",
       "email_configs": [...],
       "pagerduty_configs": [...]
     };
     returns ['email_configs', 'pagerduty_configs']
  */
  return _.filter(_.keys(receiver), (v) => _.endsWith(v, '_configs'));
};

/**
 * Recursive function which transverses routes and sub-routes to get labels and/or matchers for each receiver.
 * Each entry is a set of labels and/or matchers used to route alerts to a receiver
 *
 * Ex: returns
 * [{
 *   "receiver": "team-Y-pager",
 *   "labels": {
 *     "service": "database",
 *     "owner": "team-Y"
 *   },
 *   "matchers": ["severity = critical"]
 * },
 * {
 *   "receiver": "team-Y-pager",
 *   "labels": {
 *     "service": "files",
 *     "severity": "critical"
 *   }
 * }]
}*/
const getRoutingLabelsByReceivers = (
  routes: AlertmanagerRoute[],
  parentLabels: { [key: string]: string } = {},
  parentMatchers: string[] = [],
): RoutingLabelsByReceivers[] => {
  let results: RoutingLabelsByReceivers[] = [];
  let labels = {};
  for (const obj of routes) {
    labels = _.merge({}, parentLabels, obj.match, obj.match_re);
    const matchers = [...parentMatchers, ...(obj.matchers ?? [])];
    results.push({ receiver: obj.receiver, labels, matchers });
    if (obj.routes) {
      results = results.concat(getRoutingLabelsByReceivers(obj.routes, labels, matchers));
    }
  }
  return results;
};

/**
 * Is receiver used in a top-level route that has no sub routes, or
 * is receiver not in any route (no routing labels)?
 */
const hasSimpleRoute = (
  config: AlertmanagerConfig,
  receiver: AlertmanagerReceiver,
  receiverRoutingLabels: RoutingLabelsByReceivers[],
): boolean => {
  const routes = _.get(config, ['route', 'routes']);
  return (
    _.filter(routes, (route) => {
      return route.receiver === receiver.name && _.isUndefined(route.routes);
    }).length > 0 || _.isEmpty(receiverRoutingLabels)
  );
};

/**
 * Does receiver contains a single known receiver type (ex: pagerduty_config), which has a single config.
 * No receiver type specified is valid, as well as a single receiver type with no config
 */
const hasSimpleReceiver = (
  config: AlertmanagerConfig,
  receiver: AlertmanagerReceiver,
  receiverIntegrationTypes: string[],
): boolean => {
  if (receiverIntegrationTypes.length === 0) {
    return true;
  } else if (receiverIntegrationTypes.length === 1) {
    const receiverConfig = receiverIntegrationTypes[0]; // ex: 'pagerduty_configs'
    const numConfigs = _.get(receiver, receiverConfig)?.length; // 'pagerduty_configs' is array and may have multiple sets of properties
    return _.hasIn(receiverTypes, receiverConfig) && numConfigs <= 1; // known receiver type and a single set of props
  }
  return false;
};

export const numberOfIncompleteReceivers = (config: AlertmanagerConfig): number => {
  const { route, receivers } = config;
  const { receiver: defaultReceiverName } = route || {};

  // if no receivers or default receiver, then no longer initial setup, hide info alerts
  if (!receivers || !defaultReceiverName) {
    return 0;
  }
  const defaultReceiver = receivers.filter((receiver) => receiver.name === defaultReceiverName);
  const criticalReceiver = receivers.filter(
    (receiver) => receiver.name === InitialReceivers.Critical,
  );

  const numIncompleteReceivers =
    !_.isEmpty(defaultReceiver) && _.isEmpty(getIntegrationTypes(defaultReceiver[0])) ? 1 : 0;

  return !_.isEmpty(criticalReceiver) && _.isEmpty(getIntegrationTypes(criticalReceiver[0]))
    ? numIncompleteReceivers + 1
    : numIncompleteReceivers;
};

const RoutingLabels: React.FC<RoutingLabelsProps> = ({ data }) => {
  const { labels, matchers } = data;
  const lbls = _.map(labels || {}, (value, key) => `${key}=${value}`);
  const values = [...lbls, ...(matchers ?? [])];

  return values.length > 0 ? (
    <PfLabelGroup>
      {values.map((value, i) => (
        <PfLabel key={`label-${i}`}>{value}</PfLabel>
      ))}
    </PfLabelGroup>
  ) : null;
};

const deleteReceiver = (
  secret: K8sResourceKind,
  config: AlertmanagerConfig,
  receiverName: string,
  navigate: any,
) => {
  // Create a deep copy of the config to avoid mutating the original
  const updatedConfig = _.cloneDeep(config);
  // remove any routes which use receiverToDelete
  _.update(updatedConfig, 'route.routes', (routes) => {
    _.remove(routes, (route: AlertmanagerRoute) => route.receiver === receiverName);
    return routes;
  });
  // delete receiver
  _.update(updatedConfig, 'receivers', (receivers) => {
    _.remove(receivers, (receiver: AlertmanagerReceiver) => receiver.name === receiverName);
    return receivers;
  });
  return patchAlertmanagerConfig(secret, updatedConfig).then(() => {
    navigate('/settings/cluster/alertmanagerconfig');
  });
};

type ReceiverFilters = {
  name: string;
};

interface ReceiversTableProps {
  secret: K8sResourceKind;
  config: AlertmanagerConfig;
  data: AlertmanagerReceiver[];
}

const ReceiversTable: React.FC<ReceiversTableProps> = (props) => {
  const { secret, config, data } = props;
  const { route } = config;
  const { receiver: defaultReceiverName, routes } = route;
  const { t } = useTranslation();
  const label = t('public~Receivers');
  const navigate = useNavigate();

  const routingLabelsByReceivers = React.useMemo(
    () => (_.isEmpty(routes) ? [] : getRoutingLabelsByReceivers(routes)),
    [routes],
  );

  const openDeleteReceiverConfirm = useWarningModal();

  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<ReceiverFilters>({
    initialFilters: { name: '' },
    searchParams,
    setSearchParams,
  });

  const { sortBy, direction, onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: { sortBy: 'name', direction: 'asc' },
  });

  const filteredData = React.useMemo(() => {
    let result = data;

    if (filters.name) {
      result = result.filter((receiver) =>
        fuzzy(filters.name.toLowerCase(), receiver.name.toLowerCase()),
      );
    }

    const sortDirection = direction || 'asc';
    const sortColumn = sortBy || 'name';

    if (sortColumn === 'name') {
      result = [...result].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const comparison = aName.localeCompare(bName);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters.name, sortBy, direction]);

  const getSortParams = React.useCallback(
    (columnIndex: number, columnKey: string) => {
      const currentSortBy = sortBy || 'name';
      const currentDirection = direction || 'asc';

      return {
        sortBy: {
          index: currentSortBy === columnKey ? 0 : -1,
          direction: currentDirection,
          defaultDirection: 'asc' as const,
        },
        onSort: (
          _event: React.MouseEvent | React.KeyboardEvent,
          index: number,
          sortDirection: 'asc' | 'desc',
        ) => onSort(_event, columnKey, sortDirection),
        columnIndex,
      };
    },
    [sortBy, direction, onSort],
  );

  const columns = React.useMemo(
    () => [
      {
        cell: t('public~Name'),
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
          sort: getSortParams(0, 'name'),
        },
      },
      {
        cell: t('public~Integration type'),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        cell: t('public~Routing labels'),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        cell: <span className="pf-v6-u-screen-reader">{t('public~Actions')}</span>,
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
    ],
    [t, getSortParams],
  );

  const pagination = useDataViewPagination({
    perPage: 50,
    searchParams,
    setSearchParams,
  });

  // Reset pagination to page 1 when filters change
  React.useEffect(() => {
    if (pagination.page > 1) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', '1');
        return newParams;
      });
    }
  }, [filters.name, pagination.page, setSearchParams]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.perPage;
    return filteredData.slice(startIndex, startIndex + pagination.perPage);
  }, [filteredData, pagination.page, pagination.perPage]);

  // Function to create row data for a receiver
  const createReceiverRow = React.useCallback(
    (receiver: AlertmanagerReceiver): DataViewTr => {
      // filter to routing labels belonging to current Receiver
      const receiverRoutingLabels = _.filter(routingLabelsByReceivers, {
        receiver: receiver.name,
      });
      const receiverIntegrationTypes = getIntegrationTypes(receiver);
      const integrationTypesLabel = _.join(
        _.map(receiverIntegrationTypes, (type) => type.substr(0, type.indexOf('_configs'))),
        ', ',
      );
      const isDefaultReceiver = receiver.name === defaultReceiverName;
      const receiverHasSimpleRoute = hasSimpleRoute(config, receiver, receiverRoutingLabels);

      // Receiver form can only handle simple configurations. Can edit via form if receiver
      // has a simple route and receiver
      const canUseEditForm =
        receiverHasSimpleRoute && hasSimpleReceiver(config, receiver, receiverIntegrationTypes);

      // Receivers can be deleted if it has a simple route and not the default receiver
      const canDelete = !isDefaultReceiver && receiverHasSimpleRoute;

      const receiverMenuItems = (receiverName: string) => [
        {
          label: t('public~Edit Receiver'),
          callback: () => {
            const targetUrl = canUseEditForm
              ? `/settings/cluster/alertmanagerconfig/receivers/${receiverName}/edit`
              : `/settings/cluster/alertmanageryaml`;
            return navigate(targetUrl);
          },
        },
        {
          label: t('public~Delete Receiver'),
          isDisabled: !canDelete,
          tooltip: !canDelete
            ? t('public~Cannot delete the default receiver, or a receiver which has a sub-route')
            : '',
          callback: () => {
            openDeleteReceiverConfirm({
              title: t('public~Delete Receiver'),
              children: t('public~Are you sure you want to delete receiver {{receiverName}}?', {
                receiverName,
              }),
              confirmButtonLabel: t('public~Delete Receiver'),
              confirmButtonVariant: ButtonVariant.danger,
              onConfirm: () => {
                deleteReceiver(secret, config, receiverName, navigate);
              },
              ouiaId: 'AlertmanagerDeleteReceiverConfirmation',
            });
          },
        },
      ];

      return [
        {
          cell: receiver.name,
          props: getNameCellProps(receiver.name),
        },
        {
          cell:
            (receiver.name === InitialReceivers.Critical ||
              receiver.name === InitialReceivers.Default) &&
            !integrationTypesLabel ? (
              <Link to={`/settings/cluster/alertmanagerconfig/receivers/${receiver.name}/edit`}>
                {t('public~Configure')}
                <PencilAltIcon className="co-icon-space-l" />
              </Link>
            ) : (
              integrationTypesLabel
            ),
          props: {
            'data-test': `data-view-cell-${receiver.name}-integration-types`,
          },
        },
        {
          cell: isDefaultReceiver
            ? t('public~All (default receiver)')
            : _.map(receiverRoutingLabels, (rte, i) => {
                return <RoutingLabels data={rte} key={i} />;
              }),
          props: {
            'data-test': `data-view-cell-${receiver.name}-routing-labels`,
          },
        },
        {
          cell: <Kebab options={receiverMenuItems(receiver.name)} />,
          props: {
            ...actionsCellProps,
          },
        },
      ];
    },
    [
      routingLabelsByReceivers,
      defaultReceiverName,
      config,
      t,
      navigate,
      openDeleteReceiverConfirm,
      secret,
    ],
  );

  const rows: DataViewTr[] = React.useMemo(() => paginatedData.map(createReceiverRow), [
    paginatedData,
    createReceiverRow,
  ]);

  const bodyLoading = React.useMemo(() => <BodyLoading columns={columns.length} />, [
    columns.length,
  ]);

  const bodyEmpty = React.useMemo(() => <BodyEmpty label={label} colSpan={columns.length} />, [
    columns.length,
    label,
  ]);

  const activeState = React.useMemo(() => {
    if (filteredData.length === 0) {
      return DataViewState.empty;
    }
    return undefined;
  }, [filteredData.length]);

  return (
    <DataView activeState={activeState}>
      <DataViewToolbar
        filters={
          <DataViewFilters values={filters} onChange={(_e, values) => onSetFilters(values)}>
            <DataViewTextFilter
              filterId="name"
              title={t('public~Name')}
              placeholder={t('public~Filter by name')}
            />
          </DataViewFilters>
        }
        clearAllFilters={clearAllFilters}
        pagination={
          <Pagination
            itemCount={filteredData.length}
            page={pagination.page}
            perPage={pagination.perPage}
            onSetPage={pagination.onSetPage}
            onPerPageSelect={pagination.onPerPageSelect}
          />
        }
      />
      <InnerScrollContainer>
        <DataViewTable
          aria-label={t('public~Receivers table')}
          columns={columns}
          rows={rows}
          bodyStates={{ empty: bodyEmpty, loading: bodyLoading }}
          gridBreakPoint=""
          variant="compact"
          data-test="data-view-table"
        />
      </InnerScrollContainer>
    </DataView>
  );
};
ReceiversTable.displayName = 'ReceiversTable';

const ReceiversEmptyState: React.FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <EmptyState
      headingLevel="h2"
      titleText={<>{t('public~No receivers found')}</>}
      variant={EmptyStateVariant.full}
    >
      <EmptyStateBody>
        {t(
          'public~Create a receiver to get OpenShift alerts through other services such as email or a chat platform. The first receiver you create will become the default receiver and will automatically receive all alerts from this cluster. Subsequent receivers can have specific sets of alerts routed to them.',
        )}
      </EmptyStateBody>
    </EmptyState>
  );
};

interface ReceiversProps {
  secret: K8sResourceKind;
  config: AlertmanagerConfig;
}

const Receivers = ({ secret, config }: ReceiversProps) => {
  const receivers = _.get(config, 'receivers', []);

  const numOfIncompleteReceivers = numberOfIncompleteReceivers(config);
  const { t } = useTranslation();
  const receiverString = t('public~receiver', { count: numOfIncompleteReceivers });
  return (
    <PaneBody>
      <SectionHeading text={t('public~Receivers')}>
        <Link to="/settings/cluster/alertmanagerconfig/receivers/~new">
          <Button variant="primary" data-test="create-receiver">
            {t('public~Create Receiver')}
          </Button>
        </Link>
      </SectionHeading>
      {numOfIncompleteReceivers > 0 && (
        <Alert
          isInline
          className="co-alert co-alert--scrollable"
          variant="info"
          title={t('public~Incomplete alert {{receiverString}}', { receiverString })}
        >
          <div className="co-pre-line">
            {t(
              'public~Configure the {{receiverString}} to ensure that you learn about important issues with your cluster.',
              { receiverString },
            )}
          </div>
        </Alert>
      )}
      {_.isEmpty(receivers) ? (
        <ReceiversEmptyState />
      ) : (
        <ReceiversTable secret={secret} config={config} data={receivers} />
      )}
    </PaneBody>
  );
};

const AlertmanagerConfiguration: React.FC<AlertmanagerConfigurationProps> = ({ obj: secret }) => {
  const { t } = useTranslation();
  const { config, errorMessage } = getAlertmanagerConfig(secret);

  if (errorMessage) {
    return (
      <Alert
        isInline
        className="co-alert co-alert--scrollable"
        variant="danger"
        title={t('public~An error occurred')}
      >
        <div className="co-pre-line">{errorMessage}</div>
      </Alert>
    );
  }

  return (
    <>
      <AlertRouting secret={secret} config={config} />
      <Receivers secret={secret} config={config} />
    </>
  );
};

const AlertmanagerConfigWrapper: React.FC<AlertmanagerConfigWrapperProps> = React.memo(
  ({ obj, ...props }) => {
    const { t } = useTranslation();
    return (
      <>
        <DocumentTitle>{t('public~Alerting')}</DocumentTitle>
        <StatusBox {...obj}>
          <AlertmanagerConfiguration {...props} obj={obj.data} />
        </StatusBox>
      </>
    );
  },
);

export const AlertmanagerConfig: React.FC = () => {
  const { t } = useTranslation();

  const configPath = 'alertmanagerconfig';
  const YAMLPath = 'alertmanageryaml';

  const breadcrumbs = breadcrumbsForGlobalConfig('Alertmanager', configPath);

  return (
    <>
      <PageHeading breadcrumbs={breadcrumbs} title={t('public~Alertmanager')} />
      <NavBar
        pages={[
          {
            name: t('public~Details'),
            href: configPath,
          },
          {
            name: t('public~YAML'),
            href: YAMLPath,
          },
        ]}
      />
      <Firehose
        resources={[
          {
            kind: 'Secret',
            name: 'alertmanager-main',
            namespace: 'openshift-monitoring',
            isList: false,
            prop: 'obj',
          },
        ]}
      >
        <AlertmanagerConfigWrapper />
      </Firehose>
    </>
  );
};

type AlertmanagerConfigWrapperProps = {
  obj?: {
    data?: K8sResourceKind;
    [key: string]: any;
  };
};

type AlertmanagerConfigurationProps = {
  obj?: K8sResourceKind;
  onCancel?: () => void;
};
type labels = {
  [key: string]: string;
};

export type AlertmanagerRoute = {
  receiver?: string;
  groupBy?: { [key: string]: string };
  groupWait?: string;
  groupInterval?: string;
  repeatInterval?: string;
  match?: labels[];
  match_re?: labels[];
  routes?: AlertmanagerRoute[];
  matchers?: string[];
};

type RoutingLabelsByReceivers = {
  receiver: string;
  labels: { [key: string]: string };
  matchers: string[];
};

type WebhookConfig = {
  url: string;
};

type PagerDutyConfig = {
  routingKey?: string;
  serviceKey?: string;
};

export type AlertmanagerReceiver = {
  name: string;
  webhookConfigs?: WebhookConfig[];
  pagerdutyConfigs?: PagerDutyConfig[];
};

// eslint-disable-next-line no-redeclare
export type AlertmanagerConfig = {
  global: { [key: string]: string };
  route: AlertmanagerRoute;
  receivers: AlertmanagerReceiver[];
};

type RoutingLabelsProps = {
  data: RoutingLabelsByReceivers;
};
