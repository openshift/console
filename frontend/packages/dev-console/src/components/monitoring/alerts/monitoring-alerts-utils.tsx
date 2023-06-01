import * as React from 'react';
import { SortByDirection } from '@patternfly/react-table';
import i18next from 'i18next';
import * as _ from 'lodash';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Alert, AlertStates, Rule, Silence } from '@console/dynamic-plugin-sdk';
import {
  alertingErrored,
  alertingLoaded,
  alertingLoading,
} from '@console/internal/actions/observe';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { ALERTMANAGER_TENANCY_BASE_PATH } from '@console/internal/components/graphs';
import {
  StateCounts,
  Severity,
  AlertState,
  severityRowFilter,
  alertStateFilter,
} from '@console/internal/components/monitoring/alerting';
import {
  alertDescription,
  alertState,
  alertSeverityOrder,
  alertingRuleStateOrder,
  labelsToParams,
} from '@console/internal/components/monitoring/utils';
import { Kebab } from '@console/internal/components/utils';
import {
  URL_POLL_DEFAULT_DELAY,
  useURLPoll,
} from '@console/internal/components/utils/url-poll-hook';
import { YellowExclamationTriangleIcon } from '@console/shared';
import SilenceAlert from './SilenceAlert';

const viewAlertRule = (rule: Rule, ns: string) => ({
  label: i18next.t('devconsole~View Alerting Rule'),
  href: `/dev-monitoring/ns/${ns}/rules/${rule.id}`,
});

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
          title: _.isEmpty(rls.alerts) ? '-' : <SilenceAlert rule={rls} namespace={namespace} />,
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

export const alertFilters: RowFilter[] = [alertStateFilter(), severityRowFilter()];

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

export const useAlertManagerSilencesDispatch = ({ namespace }) => {
  const url = `${ALERTMANAGER_TENANCY_BASE_PATH}/api/v2/silences?namespace=${namespace}`;
  const [response, loadError, loading] = useURLPoll<Silence[]>(
    url,
    URL_POLL_DEFAULT_DELAY,
    namespace,
  );
  const dispatch = useDispatch();
  React.useEffect(() => {
    if (loadError) {
      dispatch(alertingErrored('devSilences', loadError, 'dev'));
    } else if (loading) {
      dispatch(alertingLoading('devSilences', 'dev'));
    } else {
      const silencesWithAlertsName = _.map(response, (s: Silence) => {
        const alertName = _.get(_.find(s.matchers, { name: 'alertname' }), 'value');
        return {
          ...s,
          name:
            alertName ||
            s.matchers.map((m) => `${m.name}${m.isRegex ? '=~' : '='}${m.value}`).join(', '),
        };
      });
      dispatch(alertingLoaded('devSilences', silencesWithAlertsName, 'dev'));
    }
  }, [dispatch, loadError, loading, response]);
};
