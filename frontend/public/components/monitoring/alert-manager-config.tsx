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

let secret: K8sResourceKind = null; // alertmanager-main Secret which holds alertmanager configuration yaml
let config: AlertmanagerConfig = null; // alertmanager configuration yaml as object

export enum InitialReceivers {
  Critical = 'Critical',
  Default = 'Default',
  Watchdog = 'Watchdog',
}

const AlertRouting = () => {
  const groupBy = _.get(config, ['route', 'group_by'], []);
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('alert-manager-config~Alert routing')}>
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
            <dt>{t('alert-manager-config~Group by')}</dt>
            <dd data-test-id="group_by_value">
              {_.isEmpty(groupBy) ? '-' : _.join(groupBy, ', ')}
            </dd>
            <dt>{t('alert-manager-config~Group wait')}</dt>
            <dd data-test-id="group_wait_value">{_.get(config, ['route', 'group_wait'], '-')}</dd>
          </dl>
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>{t('alert-manager-config~Group interval')}</dt>
            <dd data-test-id="group_interval_value">
              {_.get(config, ['route', 'group_interval'], '-')}
            </dd>
            <dt>{t('alert-manager-config~Repeat interval')}</dt>
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

const numberOfIncompleteReceivers = (): number => {
  const { route, receivers } = config;
  const { receiver: defaultReceiverName } = route;

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

const deleteReceiver = (receiverName: string) => {
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

const ReceiversTable: React.FC<ReceiverTableProps> = (props) => {
  const { filterValue } = props;
  const { route } = config;
  const { receiver: defaultReceiverName, routes } = route;
  const { t } = useTranslation();

  const routingLabelsByReceivers = _.isEmpty(routes) ? [] : getRoutingLabelsByReceivers(routes, {});
  const EmptyMsg = () => (
    <MsgBox
      title={t('alert-manager-config~No Receivers match filter {{filterValue}}', { filterValue })}
    />
  );
  const ReceiverTableHeader = () => {
    return [
      {
        title: t('alert-manager-config~Name'),
        sortField: 'name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('alert-manager-config~Integration type'),
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('alert-manager-config~Routing labels'),
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
    const receiverHasSimpleRoute = hasSimpleRoute(receiver, receiverRoutingLabels);

    // Receiver form can only handle simple configurations. Can edit via form if receiver
    // has a simple route and receiver
    const canUseEditForm =
      receiverHasSimpleRoute && hasSimpleReceiver(receiver, receiverIntegrationTypes);

    // Receivers can be deleted if it has a simple route and not the default receiver
    const canDelete = !isDefaultReceiver && receiverHasSimpleRoute;

    const receiverMenuItems = (receiverName: string) => [
      {
        label: t('alert-manager-config~Edit Receiver'),
        callback: () => {
          const targetUrl = canUseEditForm
            ? `/monitoring/alertmanagerconfig/receivers/${receiverName}/edit`
            : `/monitoring/alertmanageryaml`;
          return history.push(targetUrl);
        },
      },
      {
        label: t('alert-manager-config~Delete Receiver'),
        isDisabled: !canDelete,
        tooltip: !canDelete
          ? t(
              'alert-manager-config~Cannot delete the default receiver, or a receiver which has a sub-route',
            )
          : '',
        callback: () =>
          confirmModal({
            title: t('alert-manager-config~Delete Receiver'),
            message: t(
              'alert-manager-config~Are you sure you want to delete receiver {{receiverName}}?',
              { receiverName },
            ),
            btnText: t('alert-manager-config~Delete Receiver'),
            executeFn: () => deleteReceiver(receiverName),
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
              {t('alert-manager-config~Configure')}
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
      aria-label={t('alert-manager-config~Receivers')}
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
        {t('alert-manager-config~No receivers found')}
      </Title>
      <EmptyStateBody>
        {t(
          'alert-manager-config~Create a receiver to get OpenShift alerts through other services such as email or a chat platform. The first receiver you create will become the default receiver and will automatically receive all alerts from this cluster. Subsequent receivers can have specific sets of alerts routed to them.',
        )}
      </EmptyStateBody>
    </EmptyState>
  );
};

const Receivers = () => {
  const [receiverFilter, setReceiverFilter] = React.useState('');
  let receivers = _.get(config, 'receivers', []);
  if (receiverFilter) {
    const filterStr = _.toLower(receiverFilter);
    receivers = receivers.filter((receiver) => fuzzy(filterStr, _.toLower(receiver.name)));
  }

  const numOfIncompleteReceivers = numberOfIncompleteReceivers();
  const { t } = useTranslation();
  const receiverString = t('alert-manager-config~receiver', { count: numOfIncompleteReceivers });
  const thisString = t('alert-manager-config~this', {
    count: numOfIncompleteReceivers,
  });
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('alert-manager-config~Receivers')} />
      <div className="co-m-pane__filter-row">
        <TextFilter
          defaultValue=""
          label={t('alert-manager-config~Receivers by name')}
          onChange={(val) => setReceiverFilter(val)}
        />
        <Link
          className="co-m-primary-action co-m-pane__filter-row-action"
          to="/monitoring/alertmanagerconfig/receivers/~new"
        >
          <Button variant="primary" data-test-id="create-receiver">
            {t('alert-manager-config~Create Receiver')}
          </Button>
        </Link>
      </div>
      {numOfIncompleteReceivers > 0 && (
        <Alert
          isInline
          className="co-alert co-alert--scrollable"
          variant="info"
          title={t('alert-manager-config~Incomplete alert {{receiverString}}', { receiverString })}
        >
          <div className="co-pre-line">
            {t(
              'alert-manager-config~Configure {{thisString}} {{receiverString}} to ensure that you learn about important issues with your cluster.',
              { thisString, receiverString },
            )}
          </div>
        </Alert>
      )}
      {_.isEmpty(receivers) && !receiverFilter ? (
        <ReceiversEmptyState />
      ) : (
        <ReceiversTable filterValue={receiverFilter} data={receivers} />
      )}
    </div>
  );
};

const AlertmanagerConfiguration: React.FC<AlertmanagerConfigurationProps> = ({ obj }) => {
  const [errorMsg, setErrorMsg] = React.useState('');
  secret = obj; // alertmanager-main Secret which holds encoded alertmanager configuration yaml
  const { t } = useTranslation();
  if (!errorMsg) {
    config = getAlertmanagerConfig(secret, setErrorMsg);
  }

  if (errorMsg) {
    return (
      <Alert
        isInline
        className="co-alert co-alert--scrollable"
        variant="danger"
        title={t('alert-manager-config~An error occurred')}
      >
        <div className="co-pre-line">{errorMsg}</div>
      </Alert>
    );
  }

  return (
    <>
      <AlertRouting />
      <Receivers />
    </>
  );
};

export const AlertmanagerConfigWrapper: React.FC<AlertmanagerConfigWrapperProps> = React.memo(
  ({ obj, ...props }) => {
    const { t } = useTranslation();
    return (
      <>
        <Helmet>
          <title>{t('alert-manager-config~Alerting')}</title>
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

type ReceiverTableProps = {
  data: AlertmanagerReceiver[];
  filterValue?: string;
};

type RoutingLabelProps = {
  labels: { [key: string]: string };
};
