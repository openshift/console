import * as React from 'react';
import * as _ from 'lodash';
import {
  expandable,
  sortable,
  cellWidth,
  SortByDirection,
  ITransform,
  IFormatter,
} from '@patternfly/react-table';
import {
  StateCounts,
  Severity,
  AlertState,
  alertsRowFilters,
  severityRowFilter,
} from '@console/internal/components/monitoring/alerting';
import { Kebab } from '@console/internal/components/utils';
import {
  alertDescription,
  alertState,
  alertSeverityOrder,
  alertingRuleStateOrder,
  RuleStates,
} from '@console/internal/reducers/monitoring';
import { Alert, Rule } from '@console/internal/components/monitoring/types';
import { YellowExclamationTriangleIcon } from '@console/shared';

const viewAlertRule = {
  label: 'View Alerting Rule',
};

type MonitoringAlertColumn = {
  title: string;
  cellFormatters?: IFormatter[];
  transforms?: ITransform[];
  fieldName?: string;
  sortFunc?: string;
};

export const monitoringAlertColumn: MonitoringAlertColumn[] = [
  {
    title: 'Name',
    cellFormatters: [expandable],
    transforms: [sortable],
    fieldName: 'name',
    sortFunc: 'nameOrder',
  },
  {
    title: 'Severity',
    transforms: [sortable, cellWidth(20)],
    fieldName: 'severity',
    sortFunc: 'alertSeverityOrder',
  },
  {
    title: 'Alert State',
    transforms: [sortable, cellWidth(20)],
    fieldName: 'alertState',
    sortFunc: 'alertingRuleStateOrder',
  },
  { title: '' },
];

export const monitoringAlertRows = (alertrules: Rule[], collapsedRowsIds: string[]) => {
  const rows = [];
  _.forEach(alertrules, (rls) => {
    rows.push({
      ...(rls.state !== RuleStates.Inactive && {
        isOpen: rls.state === RuleStates.Firing && !_.includes(collapsedRowsIds, rls.name),
      }),
      cells: [
        {
          title:
            rls.state !== 'firing' ? (
              rls.name
            ) : (
              <>
                <YellowExclamationTriangleIcon /> {rls.name}
              </>
            ),
          id: rls.name,
        },
        {
          title: <Severity severity={rls.labels?.severity} />,
        },
        {
          title: _.isEmpty(rls.alerts) ? 'Not Firing' : <StateCounts alerts={rls.alerts} />,
        },
        {
          title: (
            <div className="odc-monitoring-alerts--kebab">
              <Kebab options={[viewAlertRule]} />
            </div>
          ),
        },
      ],
    });
    _.forEach(rls.alerts, (alert: Alert) => {
      rows.push({
        parent: _.findIndex(rows, (r) => r.cells[0].id === rls.name),
        fullWidth: true,
        cells: [
          {
            title: (
              <div className="odc-monitoring-alerts--alert-title">{alertDescription(alert)}</div>
            ),
            props: { colSpan: 3 },
          },
          {
            title: (
              <div className="odc-monitoring-alerts--state-column">
                <AlertState state={alertState(alert)} />
              </div>
            ),
            props: { colSpan: 2 },
          },
        ],
      });
    });
  });
  return rows;
};

export const alertFilters = [
  {
    filterGroupName: 'Alert State',
    type: 'alert-state',
    reducer: alertState,
    items: alertsRowFilters[0].items,
  },
  severityRowFilter,
];

const setOrderBy = (orderBy: SortByDirection, data: Rule[]): Rule[] => {
  return orderBy === SortByDirection.asc ? data : data.reverse();
};

const sortFunc = {
  nameOrder: (rule) => rule.name,
  alertSeverityOrder,
  alertingRuleStateOrder,
};

export const applyListSort = (rules: Rule[], orderBy: SortByDirection, func: string): Rule[] => {
  if (func) {
    const sorted = _.sortBy(rules, sortFunc[func]);
    return setOrderBy(orderBy, sorted);
  }
  return rules;
};
