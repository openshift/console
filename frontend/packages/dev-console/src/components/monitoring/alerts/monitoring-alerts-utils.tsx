import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { SortByDirection, ITransform, IFormatter } from '@patternfly/react-table';
import {
  StateCounts,
  Severity,
  AlertState,
  severityRowFilter,
  alertStateFilter,
} from '@console/internal/components/monitoring/alerting';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { Kebab } from '@console/internal/components/utils';
import {
  alertDescription,
  alertState,
  alertSeverityOrder,
  alertingRuleStateOrder,
} from '@console/internal/reducers/monitoring';
import { Alert, Rule, AlertStates } from '@console/internal/components/monitoring/types';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { labelsToParams } from '@console/internal/components/monitoring/utils';
import SilenceAlert from './SilenceAlert';

const viewAlertRule = (rule: Rule, ns: string) => ({
  label: 'View Alerting Rule',
  href: `/dev-monitoring/ns/${ns}/rules/${rule.id}`,
});

export type MonitoringAlertColumn = {
  title: string;
  cellFormatters?: IFormatter[];
  transforms?: ITransform[];
  fieldName?: string;
  sortFunc?: string;
};

export const monitoringAlertRows = (
  alertrules: Rule[],
  collapsedRowsIds: string[],
  namespace: string,
) => {
  const rows = [];
  _.forEach(alertrules, (rls) => {
    const states = _.map(rls.alerts, (a) => a.state);
    rows.push({
      ...(!_.isEmpty(states) && {
        isOpen:
          (_.includes(states, AlertStates.Firing) && !_.includes(collapsedRowsIds, rls.id)) ||
          (!_.includes(states, AlertStates.Firing) && _.includes(collapsedRowsIds, rls.id)),
      }),
      cells: [
        {
          title: !_.includes(states, AlertStates.Firing) ? (
            rls.name
          ) : (
            <>
              <YellowExclamationTriangleIcon /> {rls.name}
            </>
          ),
          id: rls.id,
        },
        {
          title: <Severity severity={rls.labels?.severity} />,
        },
        {
          title: _.isEmpty(rls.alerts) ? '-' : <StateCounts alerts={rls.alerts} />,
        },
        {
          title: <SilenceAlert rule={rls} namespace={namespace} />,
        },
        {
          title: (
            <div className="odc-monitoring-alerts--kebab">
              <Kebab options={[viewAlertRule(rls, namespace)]} />
            </div>
          ),
        },
      ],
    });
    _.forEach(rls.alerts, (alert: Alert) => {
      rows.push({
        parent: _.findIndex(rows, (r) => r.cells[0].id === rls.id),
        fullWidth: true,
        cells: [
          {
            title: (
              <Link
                to={`/dev-monitoring/ns/${namespace}/alerts/${rls.id}?${labelsToParams(
                  alert.labels,
                )}`}
              >
                {alertDescription(alert)}
              </Link>
            ),
            props: { colSpan: 3 },
          },
          {
            title: (
              <div className="odc-monitoring-alerts--state-column">
                <AlertState state={alertState(alert)} />
              </div>
            ),
            props: { colSpan: 3 },
          },
        ],
      });
    });
  });
  return rows;
};

export const alertFilters: RowFilter[] = [alertStateFilter, severityRowFilter];

const setOrderBy = (orderBy: SortByDirection, data: Rule[]): Rule[] => {
  return orderBy === SortByDirection.asc ? data : data.reverse();
};

export const alertingRuleNotificationsOrder = (rule: Rule): number[] => {
  const counts = _.countBy(rule.alerts, 'state');
  return [AlertStates.Silenced, AlertStates.Firing, AlertStates.Pending].map(
    (state) => Number.MAX_SAFE_INTEGER - (counts[state] ?? 0),
  );
};

const sortFunc = {
  nameOrder: (rule: Rule) => rule.name,
  alertSeverityOrder,
  alertingRuleStateOrder,
  alertingRuleNotificationsOrder,
};

export const applyListSort = (rules: Rule[], orderBy: SortByDirection, func: string): Rule[] => {
  if (func) {
    const sorted = _.sortBy(rules, sortFunc[func]);
    return setOrderBy(orderBy, sorted);
  }
  return rules;
};
