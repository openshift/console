import * as React from 'react';
import Helmet from 'react-helmet';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, connect } from 'react-redux';
import { match as RMatch } from 'react-router-dom';
import {
  Table,
  TableHeader,
  TableBody,
  SortByDirection,
  expandable,
  sortable,
  cellWidth,
} from '@patternfly/react-table';
import { FilterToolbar } from '@console/internal/components/filter-toolbar';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { monitoringSetRules, monitoringLoaded, sortList } from '@console/internal/actions/ui';
import { Rule } from '@console/internal/components/monitoring/types';
import { RootState } from '@console/internal/redux';
import { getURLSearchParams } from '@console/internal/components/utils';
import { getFilteredRows } from '@console/internal/components/factory';
import { alertingRuleStateOrder } from '@console/internal/reducers/monitoring';
import { usePrometheusRulesPoll } from '@console/internal/components/graphs/prometheus-rules-hook';
import {
  monitoringAlertRows,
  alertFilters,
  applyListSort,
  MonitoringAlertColumn,
} from './monitoring-alerts-utils';

import './MonitoringAlerts.scss';

type MonitoringAlertsProps = {
  match: RMatch<{
    ns?: string;
  }>;
};

type StateProps = {
  rules: Rule[];
  filters: { [key: string]: any };
  listSorts: { [key: string]: any };
};

type props = MonitoringAlertsProps & StateProps;

const reduxID = 'devMonitoringAlerts';
const textFilter = 'resource-list-text';

export const MonitoringAlerts: React.FC<props> = ({ match, rules, filters, listSorts }) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = React.useState<{ index: number; direction: SortByDirection }>({
    index: null,
    direction: SortByDirection.asc,
  });
  const monitoringAlertColumn: MonitoringAlertColumn[] = [
    {
      title: t('devconsole~Name'),
      cellFormatters: [expandable],
      transforms: [sortable],
      fieldName: 'name',
      sortFunc: 'nameOrder',
    },
    {
      title: t('devconsole~Severity'),
      transforms: [sortable, cellWidth(10)],
      fieldName: 'severity',
      sortFunc: 'alertSeverityOrder',
    },
    {
      title: t('devconsole~Alert State'),
      transforms: [sortable, cellWidth(15)],
      fieldName: 'alertState',
      sortFunc: 'alertingRuleStateOrder',
    },
    {
      title: t('devconsole~Notifications'),
      transforms: [sortable, cellWidth(20)],
      fieldName: 'notifications',
      sortFunc: 'alertingRuleNotificationsOrder',
    },
    { title: '' },
  ];
  const [rows, setRows] = React.useState([]);
  const [collapsedRowsIds, setCollapsedRowsIds] = React.useState([]);
  const dispatch = useDispatch();
  const namespace = match.params.ns;
  const { sortBy: listSortBy, orderBy: listOrderBy } = getURLSearchParams();
  const columnIndex = _.findIndex(monitoringAlertColumn, { title: listSortBy });
  const sortOrder = listOrderBy || SortByDirection.asc;
  const [response, loadError, loading] = usePrometheusRulesPoll({ namespace });
  const thanosAlertsAndRules = React.useMemo(
    () => (!loading && !loadError ? getAlertsAndRules(response?.data) : { rules: [], alerts: [] }),
    [response, loadError, loading],
  );

  React.useEffect(() => {
    const sortThanosRules = _.sortBy(thanosAlertsAndRules.rules, alertingRuleStateOrder);
    dispatch(monitoringSetRules('devRules', sortThanosRules, 'dev'));
    dispatch(monitoringLoaded('devAlerts', thanosAlertsAndRules.alerts, 'dev'));
  }, [dispatch, thanosAlertsAndRules]);

  const filteredRules = React.useMemo(() => {
    const filtersObj = filters?.toJS();
    const listSortsObj = listSorts?.toJS() || {};
    if (columnIndex > -1) {
      setSortBy({ index: columnIndex + 1, direction: sortOrder });
    }
    const fRules = getFilteredRows(filtersObj, alertFilters, rules);
    const { orderBy, func } = listSortsObj;
    return applyListSort(
      fRules,
      orderBy || listOrderBy,
      func || monitoringAlertColumn[columnIndex]?.sortFunc,
    );
  }, [filters, listSorts, columnIndex, rules, listOrderBy, monitoringAlertColumn, sortOrder]);

  React.useEffect(() => {
    const tableRows = monitoringAlertRows(filteredRules, collapsedRowsIds, namespace);
    setRows(tableRows);
  }, [collapsedRowsIds, filteredRules, namespace]);

  const onCollapse = (event: React.MouseEvent, rowKey: number, isOpen: boolean) => {
    rows[rowKey].isOpen = isOpen;
    const { id } = rows[rowKey].cells[0];
    if (!_.includes(collapsedRowsIds, id)) {
      setCollapsedRowsIds([...collapsedRowsIds, id]);
    } else if (_.includes(collapsedRowsIds, id)) {
      setCollapsedRowsIds(_.without(collapsedRowsIds, id));
    }
    setRows([...rows]);
  };
  const handleSort = (_event: React.MouseEvent, index: number, direction: SortByDirection) => {
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
  };

  return (
    <>
      <Helmet>
        <title>Alerts</title>
      </Helmet>
      <div className="odc-monitoring-alerts">
        <FilterToolbar
          rowFilters={alertFilters}
          hideLabelFilter
          reduxIDs={[reduxID]}
          textFilter={textFilter}
          data={rules}
        />
        <Table
          aria-label="Compact expandable table"
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
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    rules: state.UI.getIn(['monitoring', 'devRules']),
    filters: state.k8s.getIn([reduxID, 'filters']),
    listSorts: state.UI.getIn(['listSorts', reduxID]),
  };
};

export default connect<StateProps>(mapStateToProps)(MonitoringAlerts);
