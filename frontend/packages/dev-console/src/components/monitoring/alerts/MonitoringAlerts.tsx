import * as React from 'react';
import { Table, TableHeader, TableBody, SortByDirection } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch, connect } from 'react-redux';
import { match as RMatch } from 'react-router-dom';
import {
  RowFilter as RowFilterExt,
  Rule,
  useResolvedExtensions,
  AlertingRulesSourceExtension,
  isAlertingRulesSource,
  AlertStates,
  RuleStates,
} from '@console/dynamic-plugin-sdk';
import { sortList } from '@console/internal/actions/ui';
import { getFilteredRows } from '@console/internal/components/factory/table-data-hook';
import { FilterToolbar } from '@console/internal/components/filter-toolbar';
import { getURLSearchParams, EmptyBox, LoadingBox } from '@console/internal/components/utils';
import { NotificationAlerts } from '@console/internal/reducers/observe';
import { RootState } from '@console/internal/redux';
import {
  monitoringAlertRows,
  alertFilters,
  applyListSort,
  useAlertManagerSilencesDispatch,
} from './monitoring-alerts-utils';
import { MonitoringAlertColumn } from './MonitoringAlertColumn';
import './MonitoringAlerts.scss';
import { useRulesAlertsPoller } from './useRuleAlertsPoller';

type MonitoringAlertsProps = {
  match: RMatch<{
    ns?: string;
  }>;
};

type StateProps = {
  rules: Rule[];
  alerts: NotificationAlerts;
  filters: { [key: string]: any };
  listSorts: { [key: string]: any };
};

type Props = MonitoringAlertsProps & StateProps;

const reduxID = 'devMonitoringAlerts';
const textFilter = 'resource-list-text';

export const MonitoringAlerts: React.FC<Props> = ({ match, rules, alerts, filters, listSorts }) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = React.useState<{ index: number; direction: SortByDirection }>({
    index: null,
    direction: SortByDirection.asc,
  });
  const [rows, setRows] = React.useState([]);
  const [collapsedRowsIds, setCollapsedRowsIds] = React.useState([]);
  const dispatch = useDispatch();
  const namespace = match.params.ns;
  const { sortBy: listSortBy, orderBy: listOrderBy } = getURLSearchParams();
  const monitoringAlertColumn = React.useMemo(() => MonitoringAlertColumn(t), [t]);
  const columnIndex = _.findIndex(monitoringAlertColumn, { title: listSortBy });
  const sortOrder = listOrderBy || SortByDirection.asc;
  const [customExtensions] = useResolvedExtensions<AlertingRulesSourceExtension>(
    isAlertingRulesSource,
  );

  const alertsSource = React.useMemo(
    () =>
      customExtensions
        // 'dev-observe-alerting' is the id that plugin extensions can use to contribute alerting rules to this component
        .filter((extension) => extension.properties.contextId === 'dev-observe-alerting')
        .map((extension) => extension.properties),
    [customExtensions],
  );

  useRulesAlertsPoller(namespace, dispatch, alertsSource);

  useAlertManagerSilencesDispatch({ namespace });

  const filteredRules = React.useMemo(() => {
    const filtersObj = filters?.toJS();
    const listSortsObj = listSorts?.toJS() || {};
    if (columnIndex > -1) {
      setSortBy({ index: columnIndex + 1, direction: sortOrder });
    }
    const fRules = getFilteredRows(filtersObj, alertFilters as RowFilterExt[], rules);
    const { orderBy, func } = listSortsObj;
    return applyListSort(
      fRules,
      orderBy || listOrderBy,
      func || monitoringAlertColumn[columnIndex]?.sortFunc,
    );
  }, [filters, listSorts, columnIndex, rules, listOrderBy, monitoringAlertColumn, sortOrder]);

  React.useEffect(() => {
    // TODO: This works around a bug where the rule's state is never set to silenced in Redux
    const newRules = _.cloneDeep(filteredRules);
    if (newRules) {
      const alertRules = alerts?.data?.map((alert) => alert.rule) ?? [];
      const silencedAlertRules = alertRules.filter((rule) => rule.state === RuleStates.Silenced);
      silencedAlertRules.forEach((alertRule) => {
        newRules.forEach((rule) => {
          if (rule.id === alertRule.id) {
            rule.state = RuleStates.Silenced;
            rule.alerts.forEach((alert) => {
              alert.state = AlertStates.Silenced;
            });
          }
        });
      });
    }

    const tableRows = monitoringAlertRows(newRules, collapsedRowsIds, namespace);
    setRows(tableRows);
  }, [alerts?.data, collapsedRowsIds, filteredRules, namespace]);

  const onCollapse = React.useCallback(
    (event: React.MouseEvent, rowKey: number, isOpen: boolean) => {
      rows[rowKey].isOpen = isOpen;
      const { id } = rows[rowKey].cells[0];
      if (!_.includes(collapsedRowsIds, id)) {
        setCollapsedRowsIds([...collapsedRowsIds, id]);
      } else if (_.includes(collapsedRowsIds, id)) {
        setCollapsedRowsIds(_.without(collapsedRowsIds, id));
      }
      setRows([...rows]);
    },
    [collapsedRowsIds, rows],
  );
  const handleSort = React.useCallback(
    (_event: React.MouseEvent, index: number, direction: SortByDirection) => {
      dispatch(
        sortList(
          reduxID,
          monitoringAlertColumn[index - 1].fieldName,
          monitoringAlertColumn[index - 1].sortFunc,
          direction,
          monitoringAlertColumn[index - 1].title,
        ),
      );
      setSortBy({ index, direction });
    },
    [dispatch, monitoringAlertColumn],
  );

  const Content = React.useMemo(() => {
    if (!alerts?.loaded && !alerts?.loadError) {
      return <LoadingBox />;
    }
    if (rules?.length === 0) {
      return <EmptyBox label={t('devconsole~Alerts')} />;
    }
    return (
      <div className="odc-monitoring-alerts">
        <FilterToolbar
          rowFilters={alertFilters}
          hideLabelFilter
          reduxIDs={[reduxID]}
          textFilter={textFilter}
          data={rules}
        />
        <Table
          aria-label={t('devconsole~Alerts')}
          onCollapse={onCollapse}
          rows={rows}
          cells={monitoringAlertColumn}
          sortBy={sortBy}
          onSort={handleSort}
        >
          <TableHeader />
          <TableBody />
        </Table>
      </div>
    );
  }, [handleSort, alerts, monitoringAlertColumn, onCollapse, rows, rules, sortBy, t]);

  return <>{Content}</>;
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    rules: state.observe.getIn(['devRules']),
    alerts: state.observe.getIn(['devAlerts']),
    filters: state.k8s.getIn([reduxID, 'filters']),
    listSorts: state.UI.getIn(['listSorts', reduxID]),
  };
};

export default connect<StateProps>(mapStateToProps)(MonitoringAlerts);
