/* eslint-disable camelcase */
import * as React from 'react';
import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import {
  Alert,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { K8sResourceKind } from '../../module/k8s';
import { history, Kebab, MsgBox, SectionHeading, StatusBox } from '../utils';
import { confirmModal, createAlertRoutingModal } from '../modals';
import { Table, TableData, TableRow, TextFilter, RowFunction } from '../factory';
import {
  getAlertmanagerConfig,
  patchAlertmanagerConfig,
  receiverTypes,
} from './alert-manager-utils';
import { Helmet } from 'react-helmet';
import { PencilAltIcon } from '@patternfly/react-icons';

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
    <div className="co-m-pane__body">
      <SectionHeading text={t('public~Alert routing')}>
        <Button
          className="co-alert-manager-config__edit-alert-routing-btn"
          onClick={() => createAlertRoutingModal({ config, secret })}
          variant="secondary"
        >
          {t('public~Edit')}
        </Button>
      </SectionHeading>
      <div className="row">
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>{t('public~Group by')}</dt>
            <dd data-test-id="group_by_value">
              {_.isEmpty(groupBy) ? '-' : _.join(groupBy, ', ')}
            </dd>
            <dt>{t('public~Group wait')}</dt>
            <dd data-test-id="group_wait_value">{_.get(config, ['route', 'group_wait'], '-')}</dd>
          </dl>
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>{t('public~Group interval')}</dt>
            <dd data-test-id="group_interval_value">
              {_.get(config, ['route', 'group_interval'], '-')}
            </dd>
            <dt>{t('public~Repeat interval')}</dt>
            <dd data-test-id="repeat_interval_value">
              {_.get(config, ['route', 'repeat_interval'], '-')}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-3', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs', 'text-center', ''),
  classNames('col-lg-6', 'col-md-6', 'col-sm-6', 'col-xs-6'),
  Kebab.columnClass,
];

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
 * Recursive function which transverses routes and sub-routes to get labels for each receiver.
 * Each entry is a set of labels used to route alerts to a receiver
 *
 * Ex: returns
 * [{
 *   "receiver": "team-Y-pager",
 *   "labels": {
 *     "service": "database",
 *     "owner": "team-Y"
 *   }
 * },
 * {
 *   "receiver": "team-Y-pager",
 *   "labels": {
 *     "service": "files",
 *     "severity": "critical"
 *   }
 * }]
}*/
const getRoutingLabelsByReceivers = (routes, parentLabels): RoutingLabelsByReceivers[] => {
  let results: RoutingLabelsByReceivers[] = [];
  let labels = {};
  for (const obj of routes) {
    labels = _.merge({}, parentLabels, obj.match, obj.match_re);
    results.push({ receiver: obj.receiver, labels });
    if (obj.routes) {
      results = results.concat(getRoutingLabelsByReceivers(obj.routes, labels));
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
    const numConfigs = _.get(receiver, receiverConfig).length; // 'pagerduty_configs' is array and may have multiple sets of properties
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

// Puts sets of key=value pairs into single comma delimited label
const RoutingLabel: React.FC<RoutingLabelProps> = ({ labels }) => {
  let count = 0;
  const list = _.map(labels, (value, key) => {
    count++;
    return key === 'default' ? (
      <span key="default" className="co-m-label__value">
        All (default receiver)
      </span>
    ) : (
      <React.Fragment key={`label-${key}-${value}`}>
        <span className="co-m-label__key">{key}</span>
        <span className="co-m-label__eq">=</span>
        <span className="co-m-label__value">{value}</span>
        {count < _.size(labels) && <>,&nbsp;</>}
      </React.Fragment>
    );
  });
  return (
    <div>
      <div className="co-m-label co-m-label--expand">{list}</div>
    </div>
  );
};

const deleteReceiver = (
  secret: K8sResourceKind,
  config: AlertmanagerConfig,
  receiverName: string,
) => {
  // remove any routes which use receiverToDelete
  _.update(config, 'route.routes', (routes) => {
    _.remove(routes, (route: AlertmanagerRoute) => route.receiver === receiverName);
    return routes;
  });
  // delete receiver
  _.update(config, 'receivers', (receivers) => {
    _.remove(receivers, (receiver: AlertmanagerReceiver) => receiver.name === receiverName);
    return receivers;
  });
  return patchAlertmanagerConfig(secret, config).then(() => {
    history.push('/monitoring/alertmanagerconfig');
  });
};

interface ReceiversTableProps {
  secret: K8sResourceKind;
  config: AlertmanagerConfig;
  data: AlertmanagerReceiver[];
  filterValue?: string;
}

const ReceiversTable: React.FC<ReceiversTableProps> = (props) => {
  const { secret, config, filterValue } = props;
  const { route } = config;
  const { receiver: defaultReceiverName, routes } = route;
  const { t } = useTranslation();

  const routingLabelsByReceivers = _.isEmpty(routes) ? [] : getRoutingLabelsByReceivers(routes, {});
  const EmptyMsg = () => (
    <MsgBox title={t('public~No Receivers match filter {{filterValue}}', { filterValue })} />
  );
  const ReceiverTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Integration type'),
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('public~Routing labels'),
        props: { className: tableColumnClasses[2] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[3] },
      },
    ];
  };
  const ReceiverTableRow: RowFunction<
    AlertmanagerReceiver,
    {
      routingLabelsByReceivers: RoutingLabelsByReceivers[];
      defaultReceiverName: string;
    }
  > = ({ obj: receiver, index, key, style }) => {
    // filter to routing labels belonging to current Receiver
    const receiverRoutingLabels = _.filter(routingLabelsByReceivers, { receiver: receiver.name });
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
            ? `/monitoring/alertmanagerconfig/receivers/${receiverName}/edit`
            : `/monitoring/alertmanageryaml`;
          return history.push(targetUrl);
        },
      },
      {
        label: t('public~Delete Receiver'),
        isDisabled: !canDelete,
        tooltip: !canDelete
          ? t('public~Cannot delete the default receiver, or a receiver which has a sub-route')
          : '',
        callback: () =>
          confirmModal({
            title: t('public~Delete Receiver'),
            message: t('public~Are you sure you want to delete receiver {{receiverName}}?', {
              receiverName,
            }),
            btnText: t('public~Delete Receiver'),
            executeFn: () => deleteReceiver(secret, config, receiverName),
          }),
      },
    ];

    return (
      <TableRow id={index} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>{receiver.name}</TableData>
        <TableData className={tableColumnClasses[1]}>
          {(receiver.name === InitialReceivers.Critical ||
            receiver.name === InitialReceivers.Default) &&
          !integrationTypesLabel ? (
            <Link to={`/monitoring/alertmanagerconfig/receivers/${receiver.name}/edit`}>
              <PencilAltIcon className="co-icon-space-r pf-c-button-icon--plain" />
              {t('public~Configure')}
            </Link>
          ) : (
            integrationTypesLabel
          )}
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          {isDefaultReceiver && <RoutingLabel labels={{ default: 'all' }} />}
          {_.map(receiverRoutingLabels, (rte, i) => {
            return !_.isEmpty(rte.labels) ? <RoutingLabel key={i} labels={rte.labels} /> : null;
          })}
        </TableData>
        <TableData className={tableColumnClasses[3]}>
          <Kebab options={receiverMenuItems(receiver.name)} />
        </TableData>
      </TableRow>
    );
  };
  return (
    <Table
      {...props}
      aria-label={t('public~Receivers')}
      customData={{ routingLabelsByReceivers, defaultReceiverName }}
      EmptyMsg={EmptyMsg}
      Header={ReceiverTableHeader}
      Row={ReceiverTableRow}
      loaded={true}
      defaultSortField="name"
      virtualize
    />
  );
};
ReceiversTable.displayName = 'ReceiversTable';

const ReceiversEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <EmptyState variant={EmptyStateVariant.full}>
      <Title headingLevel="h2" size="lg">
        {t('public~No receivers found')}
      </Title>
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
  const [receiverFilter, setReceiverFilter] = React.useState('');
  let receivers = _.get(config, 'receivers', []);
  if (receiverFilter) {
    const filterStr = _.toLower(receiverFilter);
    receivers = receivers.filter((receiver) => fuzzy(filterStr, _.toLower(receiver.name)));
  }

  const numOfIncompleteReceivers = numberOfIncompleteReceivers(config);
  const { t } = useTranslation();
  const receiverString = t('public~receiver', { count: numOfIncompleteReceivers });
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('public~Receivers')} />
      <div className="co-m-pane__filter-row">
        <TextFilter
          defaultValue=""
          label={t('public~Receivers by name')}
          onChange={(val) => setReceiverFilter(val)}
        />
        <Link
          className="co-m-primary-action co-m-pane__filter-row-action"
          to="/monitoring/alertmanagerconfig/receivers/~new"
        >
          <Button variant="primary" data-test-id="create-receiver">
            {t('public~Create Receiver')}
          </Button>
        </Link>
      </div>
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
      {_.isEmpty(receivers) && !receiverFilter ? (
        <ReceiversEmptyState />
      ) : (
        <ReceiversTable
          secret={secret}
          config={config}
          filterValue={receiverFilter}
          data={receivers}
        />
      )}
    </div>
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

export const AlertmanagerConfigWrapper: React.FC<AlertmanagerConfigWrapperProps> = React.memo(
  ({ obj, ...props }) => {
    const { t } = useTranslation();
    return (
      <>
        <Helmet>
          <title>{t('public~Alerting')}</title>
        </Helmet>
        <StatusBox {...obj}>
          <AlertmanagerConfiguration {...props} obj={obj.data} />
        </StatusBox>
      </>
    );
  },
);

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
};

type RoutingLabelsByReceivers = {
  receiver: string;
  labels: { [key: string]: string };
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

export type AlertmanagerConfig = {
  global: { [key: string]: string };
  route: AlertmanagerRoute;
  receivers: AlertmanagerReceiver[];
};

type RoutingLabelProps = {
  labels: { [key: string]: string };
};
