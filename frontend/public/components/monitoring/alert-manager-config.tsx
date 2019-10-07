import * as React from 'react';
import * as _ from 'lodash-es';
import { safeLoad } from 'js-yaml';
import { Base64 } from 'js-base64';
import * as fuzzy from 'fuzzysearch';

import { K8sResourceKind } from '../../module/k8s';
import { LoadingBox, MsgBox, SectionHeading, StatusBox } from '../utils';
import { createAlertRoutingModal } from '../modals';
import { Table, TableData, TableRow, TextFilter } from '../factory';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { EmptyState, EmptyStateBody, EmptyStateVariant, Title } from '@patternfly/react-core';

const AlertRouting: React.FC<AlertManagerProps> = ({ config, secret }) => {
  const groupBy = _.get(config, ['route', 'group_by'], []);
  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Alert Routing">
        <button
          className="btn btn-default btn-edit-alert-routing"
          onClick={() => createAlertRoutingModal({ config, secret })}
        >
          Edit
        </button>
      </SectionHeading>
      <div className="row">
        <div className="col-sm-6">
          <dt>Group By</dt>
          <dd>{_.isEmpty(groupBy) ? '-' : _.join(groupBy, ', ')}</dd>
          <dt>Group Wait</dt>
          <dd>{_.get(config, ['route', 'group_wait'], '-')}</dd>
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>Group Interval</dt>
            <dd>{_.get(config, ['route', 'group_interval'], '-')}</dd>
            <dt>Repeat Interval</dt>
            <dd>{_.get(config, ['route', 'repeat_interval'], '-')}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-3', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-6', 'col-md-6', 'col-sm-6', 'col-xs-6'),
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
  ];
};
ReceiverTableHeader.displayName = 'ReceiverTableHeader';

const getIntegrationTypes = (receiver) => {
  /* Given receiver = {
       "name": "team-X-pager",
       "email_configs": [...],
       "pagerduty_configs": [...]
     };
     returns "email, pagerduty"
  */
  const integrationTypes = _.filter(_.keys(receiver), (key) => _.includes(key, '_configs'));
  return _.join(_.map(integrationTypes, (type) => type.substr(0, type.indexOf('_configs'))), ', ');
};

// Recursive function to get hierarchy of routing labels for each receiver
const getRoutingLabels = (routes, parentLabels) => {
  let results = [];
  let labels = {};
  for (const obj of routes) {
    labels = _.merge({}, parentLabels, obj.match || obj.match_re);
    results.push({ receiver: obj.receiver, labels });
    if (obj.routes) {
      results = results.concat(getRoutingLabels(obj.routes, labels));
    }
  }
  return results;
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
        {count < _.size(labels) && <React.Fragment>,&nbsp;</React.Fragment>}
      </React.Fragment>
    );
  });
  return <div className="co-m-label co-m-label--expand">{list}</div>;
};

const ReceiverTableRow: React.FC<ReceiverTableRowProps> = ({
  obj: receiver,
  index,
  key,
  style,
  customData: routingLabels,
}) => {
  // filter to routing labels belonging to current Receiver
  const receiverRoutingLabels = _.filter(routingLabels, { receiver: receiver.name });
  return (
    <TableRow id={index} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>{receiver.name}</TableData>
      <TableData className={tableColumnClasses[1]}>{getIntegrationTypes(receiver)}</TableData>
      <TableData className={tableColumnClasses[2]}>
        {_.map(receiverRoutingLabels, (route, i) => (
          <div key={i}>
            <RoutingLabel labels={_.get(route, 'labels')} />
          </div>
        ))}
      </TableData>
    </TableRow>
  );
};
ReceiverTableRow.displayName = 'ReceiverTableRow';

const ReceiversTable: React.FC<ReceiverTableProps> = (props) => {
  const { route, filterValue } = props;
  const { receiver: defaultReceiver, routes } = route;

  const routingLabels = getRoutingLabels(routes, {});
  if (defaultReceiver) {
    routingLabels.push({ receiver: defaultReceiver, labels: { default: 'all' } });
  }
  const EmptyMsg = () => <MsgBox title={`No Receivers match filter '${filterValue}'`} />;
  return (
    <Table
      {...props}
      aria-label="Receivers"
      customData={routingLabels}
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

const Receivers: React.FC<AlertManagerProps> = ({ config }) => {
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
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter
            defaultValue=""
            label="Receivers by Name"
            onChange={(e) => setReceiverFilter(e.target.value)}
          />
        </div>
      </div>
      {_.isEmpty(receivers) && !receiverFilter ? (
        <ReceiversEmptyState />
      ) : (
        <ReceiversTable
          filterValue={receiverFilter}
          data={receivers}
          route={_.get(config, 'route')}
        />
      )}
    </div>
  );
};

const AlertManagerConfiguration: React.FC<AlertManagerConfigurationProps> = ({ obj: secret }) => {
  const alertManagerYaml = _.get(secret, ['data', 'alertmanager.yaml']);
  let errorMsg;
  let yamlStringData;
  let config;

  if (!_.isEmpty(alertManagerYaml)) {
    yamlStringData = Base64.decode(alertManagerYaml);
    try {
      config = safeLoad(yamlStringData);
    } catch (e) {
      errorMsg = `Error parsing YAML: ${e}`;
    }
  }

  return (
    <div className="co-m-pane__body">
      {errorMsg && <span>{errorMsg}</span>}
      {!errorMsg && (
        <React.Fragment>
          <AlertRouting secret={secret} config={config} />
          <Receivers config={config} />
        </React.Fragment>
      )}
    </div>
  );
};

export const AlertManagerConfigWrapper: React.FC<AlertManagerConfigWrapperProps> = React.memo(
  ({ obj, ...props }) => {
    const [inProgress, setInProgress] = React.useState(true);

    React.useEffect(() => {
      if (inProgress && !_.isEmpty(obj.data)) {
        setInProgress(false);
      }
    }, [inProgress, obj.data]);

    if (inProgress) {
      return <LoadingBox />;
    }

    return (
      <StatusBox {...obj}>
        <AlertManagerConfiguration {...props} obj={obj.data} />
      </StatusBox>
    );
  },
);

type AlertManagerConfigWrapperProps = {
  obj?: {
    data?: K8sResourceKind;
    [key: string]: any;
  };
};

type AlertManagerConfigurationProps = {
  obj?: K8sResourceKind;
  onCancel?: () => void;
};
type labels = {
  [key: string]: string;
};

type AlertManagerRoute = {
  receiver?: string;
  groupBy?: { [key: string]: string };
  groupWait?: string;
  groupInterval?: string;
  repeatInterval?: string;
  match?: labels[];
  matchRe?: labels[];
  routes?: AlertManagerRoute;
};

type RoutesByReceivers = {
  receiver: string;
  labels: { [key: string]: string };
};

type AlertManagerReceiver = {
  name: string;
};

type AlertManagerProps = {
  config: {
    route: AlertManagerRoute;
    receivers: AlertManagerReceiver[];
  };
  secret?: K8sResourceKind;
};

type ReceiverTableProps = {
  data: AlertManagerReceiver[];
  filterValue?: string;
  route: AlertManagerRoute;
};

type ReceiverTableRowProps = {
  obj: AlertManagerReceiver;
  index: number;
  key?: string;
  style: object;
  customData: RoutesByReceivers;
};

type RoutingLabelProps = {
  labels: { [key: string]: string };
};
