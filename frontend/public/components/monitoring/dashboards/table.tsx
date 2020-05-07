import * as _ from 'lodash-es';
import * as React from 'react';
import {
  ISortBy,
  sortable,
  Table as PFTable,
  TableBody,
  TableGridBreakpoint,
  TableHeader,
  TableVariant,
} from '@patternfly/react-table';

import ErrorAlert from '@console/shared/src/components/alerts/error';
import { PrometheusResponse } from '@console/shared/src/types/monitoring';

import { formatNumber } from './format';
import { ColumnStyle, Panel } from './types';
import { getPrometheusURL, PrometheusEndpoint } from '../../graphs/helpers';
import { EmptyBox, usePoll, useSafeFetch } from '../../utils';
import { TablePagination } from '../metrics';

type AugmentedColumnStyle = ColumnStyle & {
  className?: string;
};

// Get the columns from the panel styles. Filters out hidden columns and orders
// them so the label columns are displayed first.
const getColumns = (styles: ColumnStyle[]): AugmentedColumnStyle[] => {
  const labelColumns = [];
  const valueColumns = [];
  styles.forEach((col: ColumnStyle) => {
    // Remove hidden or regex columns.
    if (col.type === 'hidden' || col.pattern.startsWith('/') || !col.alias) {
      return;
    }

    if (col.pattern.startsWith('Value #')) {
      valueColumns.push(col);
    } else {
      labelColumns.push({
        ...col,
        className: 'monitoring-dashboards__label-column-header',
      });
    }
  });

  // Show non-value columns first.
  return [...labelColumns, ...valueColumns];
};

const paginationOptions = [5, 10, 20, 50, 100].map((n) => ({
  title: n.toString(),
  value: n,
}));

const Table: React.FC<Props> = ({ panel, pollInterval, queries }) => {
  const [error, setError] = React.useState();
  const [isLoading, setLoading] = React.useState(true);
  const [data, setData] = React.useState();
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(5);
  const [sortBy, setSortBy] = React.useState<ISortBy>({ index: 0, direction: 'asc' });
  const onSort = (e, index: ISortBy['index'], direction: ISortBy['direction']) =>
    setSortBy({ index, direction });
  const safeFetch = React.useCallback(useSafeFetch(), []);

  const tick = () => {
    Promise.all(
      queries.map((q) =>
        safeFetch(getPrometheusURL({ endpoint: PrometheusEndpoint.QUERY, query: q })),
      ),
    )
      .then((responses: PrometheusResponse[]) => {
        setError(undefined);
        setLoading(false);
        // Note: This makes the following assumptions about the data:
        // 1. The transform is `table`
        // 2. The value will be an instance vector (single value).
        // 3. The time column is hidden.
        // The Grafana implementation is much more involved. See
        //   https://grafana.com/docs/grafana/latest/features/panels/table_panel/#merge-multiple-queries-per-table
        setData(
          responses.reduce((acc, response, i: number) => {
            const id = panel.targets[i].refId;
            response.data.result.forEach(({ metric, value }) => {
              const label = _.first(Object.keys(metric));
              const tag = metric[label];
              if (!acc[tag]) {
                acc[tag] = { ...metric };
              }
              acc[tag][`Value #${id}`] = value[1] || '';
            });
            return acc;
          }, {} as any),
        );
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(_.get(err, 'json.error', err.message));
          setLoading(false);
          setData(undefined);
        }
      });
  };

  usePoll(tick, pollInterval, queries);
  if (isLoading) {
    return <div className="loading-skeleton--table" />;
  }
  if (error) {
    return <ErrorAlert message={error} />;
  }
  if (_.isEmpty(data)) {
    return <EmptyBox label="Data" />;
  }

  const columns: AugmentedColumnStyle[] = getColumns(panel.styles);

  // Sort the data.
  const sort = (row) => {
    const { pattern, type } = columns[sortBy.index];
    const val = row[pattern];
    if (type !== 'number') {
      return val;
    }
    if (_.isNil(val)) {
      return Number.MIN_VALUE;
    }
    const num = Number(val);
    // Some columns styles claim to be numbers, but have string data. Still sort those as strings.
    return _.isFinite(num) ? num : val;
  };
  const sortedData = _.orderBy(data, [sort], [sortBy.direction]);
  const visibleData = sortedData.slice((page - 1) * perPage, page * perPage);

  // Format the table rows.
  const rows: string[][] = visibleData.map((values: { [key: string]: string }) => {
    return columns.reduce((acc: string[], { type, decimals = 2, pattern, unit = '' }) => {
      const value = values[pattern];
      switch (type) {
        case 'number':
          acc.push(formatNumber(value, decimals, unit));
          break;
        default:
          acc.push(value || '-');
      }
      return acc;
    }, []);
  });

  const headers = columns.map(({ alias: title, className }) => ({
    title,
    transforms: [sortable],
    ...(className ? { props: { className } } : {}),
  }));

  return (
    <>
      <div className="monitoring-dashboards__table-container">
        <PFTable
          aria-label="query results table"
          cells={headers}
          className="monitoring-dashboards__table"
          gridBreakPoint={TableGridBreakpoint.none}
          onSort={onSort}
          rows={rows}
          sortBy={sortBy}
          variant={TableVariant.compact}
        >
          <TableHeader />
          <TableBody />
        </PFTable>
      </div>
      <TablePagination
        itemCount={sortedData.length}
        paginationOptions={paginationOptions}
        page={page}
        perPage={perPage}
        setPage={setPage}
        setPerPage={setPerPage}
      />
    </>
  );
};

type Props = {
  panel: Panel;
  pollInterval: number;
  queries: string[];
};

export default Table;
