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

const AlertRouting = () => {
  const groupBy = _.get(config, ['route', 'group_by'], []);
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Alert Routing">
        <Button
          className="co-alert-manager-config__edit-alert-routing-btn"
          onClick={() => createAlertRoutingModal({ config, secret })}
          variant="secondary"
        >
          Edit
        </Button>
      </SectionHeading>
      <div className="row">
        <div className="col-sm-6">
          <dt>Group By</dt>
          <dd data-test-id="group_by_value">{_.isEmpty(groupBy) ? '-' : _.join(groupBy, ', ')}</dd>
          <dt>Group Wait</dt>
          <dd data-test-id="group_wait_value">{_.get(config, ['route', 'group_wait'], '-')}</dd>
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>Group Interval</dt>
            <dd data-test-id="group_interval_value">
              {_.get(config, ['route', 'group_interval'], '-')}
            </dd>
            <dt>Repeat Interval</dt>
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

const ReceiverTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Integration Type',
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Routing Labels',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[3] },
    },
  ];
};
ReceiverTableHeader.displayName = 'ReceiverTableHeader';

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

const hasIncompleteDefaultReceiver = () => {
  const { route, receivers } = config;
  const { receiver: defaultReceiverName } = route;
  const defaultReceiver = _.filter(receivers, { name: defaultReceiverName });
  return defaultReceiver.length === 1 && _.isEmpty(getIntegrationTypes(defaultReceiver[0]));
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

const receiverMenuItems = (receiverName: string, canDelete: boolean, canUseEditForm: boolean) => [
  {
    label: `Edit ${canUseEditForm ? 'Receiver' : 'YAML'}`,
    callback: () => {
      const targetUrl = canUseEditForm
        ? `/monitoring/alertmanagerconfig/receivers/${receiverName}/edit`
        : `/monitoring/alertmanageryaml`;
      return history.push(targetUrl);
    },
  },
  {
    label: 'Delete Receiver',
    isDisabled: !canDelete,
    tooltip: !canDelete
      ? 'Cannot delete the default receiver, or a receiver which has a sub-route'
      : '',
    callback: () =>
      confirmModal({
        title: 'Delete Receiver',
        message: `Are you sure you want to delete receiver '${receiverName}' ?`,
        btnText: 'Delete Receiver',
        executeFn: () => deleteReceiver(receiverName),
      }),
  },
];

const ReceiverTableRow: RowFunction<
  AlertmanagerReceiver,
  {
    routingLabelsByReceivers: RoutingLabelsByReceivers[];
    defaultReceiverName: string;
  }
> = ({ obj: receiver, index, key, style, customData }) => {
  const { routingLabelsByReceivers, defaultReceiverName } = customData;
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

  return (
    <TableRow id={index} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>{receiver.name}</TableData>
      <TableData className={tableColumnClasses[1]}>
        {!integrationTypesLabel ? (
          <Link to={`/monitoring/alertmanagerconfig/receivers/${receiver.name}/edit`}>
            <PencilAltIcon className="co-icon-space-r pf-c-button-icon--plain" />
            Configure
          </Link>
        ) : (
          integrationTypesLabel
        )}
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        {isDefaultReceiver && <RoutingLabel labels={{ default: 'all' }} />}
        {_.map(receiverRoutingLabels, (route, i) => {
          return !_.isEmpty(route.labels) ? <RoutingLabel key={i} labels={route.labels} /> : null;
        })}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Kebab options={receiverMenuItems(receiver.name, canDelete, canUseEditForm)} />
      </TableData>
    </TableRow>
  );
};

const ReceiversTable: React.FC<ReceiverTableProps> = (props) => {
  const { filterValue } = props;
  const { route } = config;
  const { receiver: defaultReceiverName, routes } = route;

  const routingLabelsByReceivers = _.isEmpty(routes) ? [] : getRoutingLabelsByReceivers(routes, {});
  const EmptyMsg = () => <MsgBox title={`No Receivers match filter '${filterValue}'`} />;
  return (
    <Table
      {...props}
      aria-label="Receivers"
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

const ReceiversEmptyState: React.FC = () => (
  <EmptyState variant={EmptyStateVariant.full}>
    <Title size="lg">No Receivers Found</Title>
    <EmptyStateBody>
      Create a receiver to get OpenShift alerts through other services such as email or a chat
      platform. The first receiver you create will become the default receiver and will
      automatically receive all alerts from this cluster. Subsequent receivers can have specific
      sets of alerts routed to them.
    </EmptyStateBody>
  </EmptyState>
);

const Receivers = () => {
  const [receiverFilter, setReceiverFilter] = React.useState('');
  let receivers = _.get(config, 'receivers', []);
  if (receiverFilter) {
    const filterStr = _.toLower(receiverFilter);
    receivers = receivers.filter((receiver) => fuzzy(filterStr, _.toLower(receiver.name)));
  }

  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Receivers" />
      <div className="co-m-pane__filter-bar co-m-pane__filter-bar--alt">
        <div className="co-m-pane__filter-bar-group">
          <Link className="co-m-primary-action" to="/monitoring/alertmanagerconfig/receivers/~new">
            <Button variant="primary" data-test-id="create-receiver">
              Create Receiver
            </Button>
          </Link>
        </div>
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter
            defaultValue=""
            label="Receivers by Name"
            onChange={(e) => setReceiverFilter(e.target.value)}
          />
        </div>
      </div>
      {hasIncompleteDefaultReceiver() && (
        <Alert
          isInline
          className="co-alert co-alert--scrollable"
          variant="info"
          title="Incomplete Default Receiver"
        >
          <div className="co-pre-line">
            Configure this receiver to ensure that you learn about important issues with your
            cluster.
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
  if (!errorMsg) {
    config = getAlertmanagerConfig(secret, setErrorMsg);
  }

  if (errorMsg) {
    return (
      <Alert
        isInline
        className="co-alert co-alert--scrollable"
        variant="danger"
        title="An error occurred"
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
    return (
      <>
        <Helmet>
          <title>Alerting</title>
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
