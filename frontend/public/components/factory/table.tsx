import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';

import * as UIActions from '../../actions/ui';
import { ingressValidHosts } from '../ingress';
import { alertStateOrder, silenceStateOrder } from '../../reducers/monitoring';
import { EmptyBox, StatusBox } from '../utils';
import {
  getJobTypeAndCompletions,
  K8sResourceKind,
  planExternalName,
  podPhase,
  podReadiness,
  serviceCatalogStatus,
  serviceClassDisplayName,
  getClusterOperatorStatus,
  getClusterOperatorVersion,
  getTemplateInstanceStatus,
  getNodeRoles,
} from '../../module/k8s';

import {
  IRowData, // eslint-disable-line no-unused-vars
  IExtraData, // eslint-disable-line no-unused-vars
  Table as PfTable,
  TableHeader,
  TableBody,
  TableGridBreakpoint,
  SortByDirection,
} from '@patternfly/react-table';

import { CellMeasurerCache, CellMeasurer} from 'react-virtualized';

import {
  AutoSizer,
  VirtualTableBody,
  WindowScroller,
} from '@patternfly/react-virtualized-extension';

import { tableFilters } from './table-filters';

const rowFiltersToFilterFuncs = (rowFilters) => {
  return (rowFilters || [])
    .filter(f => f.type && _.isFunction(f.filter))
    .reduce((acc, f) => ({ ...acc, [f.type]: f.filter }), {});
};

const getAllTableFilters = (rowFilters) => ({
  ...tableFilters,
  ...rowFiltersToFilterFuncs(rowFilters),
});

const getFilteredRows = (_filters, rowFilters, objects) => {
  if (_.isEmpty(_filters)) {
    return objects;
  }

  const allTableFilters = getAllTableFilters(rowFilters);
  let filteredObjects = objects;
  _.each(_filters, (value, name) => {
    const filter = allTableFilters[name];
    if (_.isFunction(filter)) {
      filteredObjects = _.filter(filteredObjects, o => filter(value, o));
    }
  });

  return filteredObjects;
};

const filterPropType = (props, propName, componentName) => {
  if (!props) {
    return;
  }

  const allTableFilters = getAllTableFilters(props.rowFilters);
  for (const key of _.keys(props[propName])) {
    if (key in allTableFilters || key === 'loadTest') {
      continue;
    }
    return new Error(`Invalid prop '${propName}' in '${componentName}'. '${key}' is not a valid filter type!`);
  }
};

const sorts = {
  alertStateOrder,
  daemonsetNumScheduled: daemonset => _.toInteger(_.get(daemonset, 'status.currentNumberScheduled')),
  dataSize: resource => _.size(_.get(resource, 'data')),
  ingressValidHosts,
  serviceCatalogStatus,
  jobCompletions: job => getJobTypeAndCompletions(job).completions,
  jobType: job => getJobTypeAndCompletions(job).type,
  nodeReadiness: node => {
    let readiness = _.get(node, 'status.conditions');
    readiness = _.find(readiness, {type: 'Ready'});
    return _.get(readiness, 'status');
  },
  numReplicas: resource => _.toInteger(_.get(resource, 'status.replicas')),
  planExternalName,
  podPhase,
  podReadiness,
  serviceClassDisplayName,
  silenceStateOrder,
  string: val => JSON.stringify(val),
  number: val => _.toNumber(val),
  getClusterOperatorStatus,
  getClusterOperatorVersion,
  getTemplateInstanceStatus,
  nodeRoles: (node: K8sResourceKind): string => {
    const roles = getNodeRoles(node);
    return roles.sort().join(', ');
  },
};

const stateToProps = ({UI}, {
  data = [],
  defaultSortField = 'metadata.name',
  defaultSortFunc = undefined,
  defaultSortAsNumber = false,
  filters = {},
  loaded = false,
  reduxID = null,
  reduxIDs = null,
  staticFilters = [{}],
  rowFilters = []}) => {
  const allFilters = staticFilters ? Object.assign({}, filters, ...staticFilters) : filters;
  let newData = getFilteredRows(allFilters, rowFilters, data);

  const listId = reduxIDs ? reduxIDs.join(',') : reduxID;
  // Only default to 'metadata.name' if no `defaultSortFunc`
  const currentSortField = UI.getIn(['listSorts', listId, 'field'], defaultSortFunc ? undefined : defaultSortField);
  const currentSortFunc = UI.getIn(['listSorts', listId, 'func'], defaultSortFunc);
  const currentSortAsNumber = UI.getIn(['listSorts', listId, 'sortAsNumber'], defaultSortAsNumber);
  const currentSortOrder = UI.getIn(['listSorts', listId, 'orderBy'], SortByDirection.asc);

  if (loaded) {
    let sortBy: string | Function = 'metadata.name';
    if (currentSortField) {
      if (currentSortAsNumber) {
        sortBy = resource => sorts.number(_.get(resource, currentSortField, ''));
      } else {
        sortBy = resource => sorts.string(_.get(resource, currentSortField, ''));
      }
    } else if (currentSortFunc && sorts[currentSortFunc]) {
      // Sort resources by a function in the 'sorts' object
      sortBy = sorts[currentSortFunc];
    }

    // Always set the secondary sort criteria to ascending by name
    newData = _.orderBy(newData, [sortBy, 'metadata.name'], [currentSortOrder, SortByDirection.asc]);
  }

  return {
    currentSortField,
    currentSortFunc,
    currentSortOrder,
    data: newData,
    unfilteredData: data,
    listId,
  };
};

// Common table row/columns helper SFCs for implementing accessible data grid
export const TableRow: React.SFC<TableRowProps> = ({id, index, trKey, style, className, ...props}) => {
  return (
    <tr {...props} data-id={id} data-index={index} data-test-rows="resource-row" data-key={trKey} style={style} className={className} role="row" />
  );
};
TableRow.displayName = 'TableRow';
export type TableRowProps = {
  id: any;
  index: number;
  trKey: string;
  style: object;
  className?: string;
}

export const TableData: React.SFC<TableDataProps> = ({className, ...props}) => {
  return (
    <td {...props} className={className} role="gridcell" />
  );
};
TableData.displayName = 'TableData';
export type TableDataProps = {
  id?: string;
  className?: string;
}

const TableWrapper: React.SFC<TableWrapperProps> = ({virtualize, ariaLabel, ariaRowCount, ...props}) => {
  return virtualize ? (
    <div {...props} role="grid" aria-label={ariaLabel} aria-rowcount={ariaRowCount} />
  ) : (
    <React.Fragment {...props} />
  );
};
export type TableWrapperProps = {
  virtualize: boolean;
  ariaLabel: string;
  ariaRowCount: number | undefined;
}

const VirtualBody: React.SFC<VirtualBodyProps> = (props) => {
  const { bindBodyRef, cellMeasurementCache, customData, Row, height, isScrolling, onChildScroll, data, columns, scrollTop, width } = props;

  const rowRenderer = ({index, isScrolling: scrolling, key, style, parent}) => {
    const rowArgs = {obj: data[index], index, columns, isScrolling: scrolling, key, style, customData};
    const row = (Row as RowFunction)(rowArgs as RowFunctionArgs);

    return <CellMeasurer
      cache={cellMeasurementCache}
      columnIndex={0}
      key={key}
      parent={parent}
      rowIndex={index}>{row}</CellMeasurer>;
  };

  return (
    <VirtualTableBody
      ref={bindBodyRef}
      autoHeight
      className="pf-c-table pf-m-compact pf-m-border-rows pf-c-virtualized pf-c-window-scroller"
      deferredMeasurementCache={cellMeasurementCache}
      rowHeight={cellMeasurementCache.rowHeight}
      height={height || 0}
      isScrolling={isScrolling}
      isScrollingOptOut={true}
      onScroll={onChildScroll}
      columnCount={1}
      rows={data}
      rowCount={data.length}
      rowRenderer={rowRenderer}
      scrollTop={scrollTop}
      width={width}
    />
  );
};

export type RowFunctionArgs = {obj: object, index: number, columns: [], isScrolling: boolean, key: string, style: object, customData?: object};
export type RowFunction = (args: RowFunctionArgs) => JSX.Element;

export type VirtualBodyProps = {
  bindBodyRef: Function;
  cellMeasurementCache: any;
  customData?: object;
  Row: RowFunction | React.ComponentClass<any, any> | React.ComponentType<any>;
  height: number;
  isScrolling: boolean;
  onChildScroll: (...args) => any;
  data: any[];
  columns: any[];
  scrollTop: number;
  width: number;
  expand: boolean;
}

export type TableProps = {
  customData?: object;
  data?: any[];
  defaultSortFunc?: string;
  defaultSortField?: string;
  filters?: {[key: string]: any};
  Header: (...args) => any[];
  loadError?: string | Object;
  Row?: RowFunction | React.ComponentClass<any, any> | React.ComponentType<any>;
  Rows?: (...args)=> any[];
  'aria-label': string;
  virtualize?: boolean;
  AllItemsFilteredMsg?: React.ComponentType<{}>;
  EmptyMsg?: React.ComponentType<{}>;
  loaded?: boolean;
  reduxID?: string;
  reduxIDs?: string[];
}

type TablePropsFromState = {};

type TablePropsFromDispatch = {};

type TableOptionProps = {
  UI: any;
}

export const Table = connect<TablePropsFromState,TablePropsFromDispatch,TableProps,TableOptionProps>(
  stateToProps,
  {sortList: UIActions.sortList},
  null,
  {areStatesEqual: ({UI: next}, {UI: prev}) => next.get('listSorts') === prev.get('listSorts')}
)(
  class TableInner extends React.Component<TableInnerProps, TableInnerState> {
    static propTypes = {
      customData: PropTypes.object,
      data: PropTypes.array,
      unfilteredData: PropTypes.array,
      AllItemsFilteredMsg: PropTypes.func,
      EmptyMsg: PropTypes.func,
      expand: PropTypes.bool,
      fieldSelector: PropTypes.string,
      filters: filterPropType,
      Header: PropTypes.func.isRequired,
      Row: PropTypes.func,
      Rows: PropTypes.func,
      loaded: PropTypes.bool,
      loadError: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
      mock: PropTypes.bool,
      namespace: PropTypes.string,
      reduxID: PropTypes.string,
      reduxIDs: PropTypes.array,
      selector: PropTypes.object,
      staticFilters: PropTypes.array,
      virtualize: PropTypes.bool,
      currentSortField: PropTypes.string,
      currentSortFunc: PropTypes.string,
      currentSortOrder: PropTypes.any,
      defaultSortField: PropTypes.string,
      defaultSortFunc: PropTypes.string,
      label: PropTypes.string,
      listId: PropTypes.string,
      sortList: PropTypes.func,
      onSelect: PropTypes.func,
    };
    _columnShift: number;
    _cellMeasurementCache: any;
    _bodyRef: any;

    constructor(props){
      super(props);
      const componentProps: any = _.pick(props, ['data', 'filters', 'selected', 'match', 'kindObj']);
      const columns = props.Header(componentProps);
      const { currentSortField, currentSortFunc, currentSortOrder} = props;

      this._columnShift = props.onSelect ? 1 : 0; //shift indexes by 1 if select provided
      this._applySort = this._applySort.bind(this);
      this._onSort = this._onSort.bind(this);
      this._handleResize = this._handleResize.bind(this);
      this._bindBodyRef = this._bindBodyRef.bind(this);
      this._refreshGrid = this._refreshGrid.bind(this);

      let sortBy = {};
      if (currentSortField && currentSortOrder) {
        const columnIndex = _.findIndex(columns, { sortField: currentSortField });
        if (columnIndex > -1){
          sortBy = { index: columnIndex + this._columnShift, direction: currentSortOrder };
        }
      } else if (currentSortFunc && currentSortOrder) {
        const columnIndex = _.findIndex(columns, { sortFunc: currentSortFunc });
        if (columnIndex > -1){
          sortBy = { index: columnIndex + this._columnShift, direction: currentSortOrder };
        }
      }
      this.state = { columns, sortBy };

      this._cellMeasurementCache = new CellMeasurerCache({
        fixedWidth: true,
        minHeight: 44,
        keyMapper: rowIndex => {
          const uid = _.get(props.data[rowIndex], 'metadata.uid', rowIndex);
          return uid;
        },
      });
    }

    componentDidMount(){
      const {columns} = this.state;
      const sp = new URLSearchParams(window.location.search);
      const columnIndex = _.findIndex(columns, {title: sp.get('sortBy')});

      if (columnIndex > -1){
        const sortOrder = sp.get('orderBy') || SortByDirection.asc;
        const column = columns[columnIndex];
        this._applySort(column.sortField, column.sortFunc, column.sortAsNumber, sortOrder, column.title);
        this.setState({
          sortBy: {
            index: columnIndex + this._columnShift,
            direction: sortOrder,
          },
        });
      }

      // re-render after resize
      window.addEventListener('resize', this._handleResize);
    }

    componentDidUpdate(prevProps){
      const {data, virtualize} = this.props;
      if (virtualize && this._bodyRef && !_.isEqual(prevProps.data, data)){
        // force react-virtualized to update after data changes with `isScrollingOptOut` set true
        this._refreshGrid();
      }
    }

    componentWillUnmount(){
      window.removeEventListener('resize', this._handleResize);
    }

    _refreshGrid() {
      this._cellMeasurementCache.clearAll();
      this._bodyRef.recomputeVirtualGridSize();
    }

    _handleResize() {
      const {virtualize} = this.props;
      if (virtualize && this._bodyRef){
        this._refreshGrid();
      }
    }

    _bindBodyRef(ref) {
      this._bodyRef = ref;
    }

    _applySort(sortField, sortFunc, sortAsNumber, direction, columnTitle){
      const {sortList, listId, currentSortFunc} = this.props;
      const applySort = _.partial(sortList, listId);
      applySort(sortField, sortFunc || currentSortFunc, sortAsNumber, direction, columnTitle);
    }

    _onSort(_event, index, direction){
      const sortColumn = this.state.columns[index - this._columnShift];
      this._applySort(sortColumn.sortField, sortColumn.sortFunc, sortColumn.sortAsNumber, direction, sortColumn.title);
      this.setState({
        sortBy: {
          index,
          direction,
        },
      });
    }

    render() {
      const {Rows, Row, expand, label, mock, onSelect, selectedResourcesForKind, 'aria-label': ariaLabel, virtualize = true, customData} = this.props;
      const {sortBy, columns} = this.state;
      const componentProps: any = _.pick(this.props, ['data', 'filters', 'selected', 'match', 'kindObj']);
      const ariaRowCount = componentProps.data && componentProps.data.length;

      const children = mock ? <EmptyBox label={label} /> : (
        <TableWrapper virtualize={virtualize} ariaLabel={ariaLabel} ariaRowCount={ariaRowCount}>
          <PfTable
            cells={columns}
            rows={virtualize ? [] : Rows({componentProps, selectedResourcesForKind, customData})}
            gridBreakPoint={virtualize ? TableGridBreakpoint.none : TableGridBreakpoint.gridMd}
            onSort={this._onSort}
            onSelect={onSelect}
            sortBy={sortBy}
            className="pf-m-compact pf-m-border-rows"
            role={virtualize ? 'presentation' : 'grid'}
            aria-label={virtualize ? null : ariaLabel}
          >
            <TableHeader />
            {!virtualize && (
              <TableBody />
            )}
          </PfTable>
          {virtualize && (
            <WindowScroller scrollElement={document.getElementById('content-scrollable')}>
              {({height, isScrolling, registerChild, onChildScroll, scrollTop}) => (
                <AutoSizer disableHeight>
                  {({width}) => (
                    <div ref={registerChild}>
                      <VirtualBody
                        bindBodyRef={this._bindBodyRef}
                        cellMeasurementCache={this._cellMeasurementCache}
                        Row={Row}
                        customData={customData}
                        height={height}
                        isScrolling={isScrolling}
                        onChildScroll={onChildScroll}
                        data={componentProps.data}
                        columns={columns}
                        scrollTop={scrollTop}
                        width={width}
                        expand={expand}
                      />
                    </div>
                  )}
                </AutoSizer>
              )}
            </WindowScroller>
          )}
        </TableWrapper>
      );
      return <div className="co-m-table-grid co-m-table-grid--bordered">
        { mock
          ? children
          : <StatusBox skeleton={<div className="loading-skeleton--table" />} {...this.props}>{children}</StatusBox> }
      </div>;
    }
  });


export type TableInnerProps = {
  'aria-label': string;
  customData?: object;
  currentSortField?: string;
  currentSortFunc?: string;
  currentSortOrder?: any;
  data?: any[];
  defaultSortField?: string;
  defaultSortFunc?: string;
  unfilteredData?: any[];
  AllItemsFilteredMsg?: React.ComponentType<{}>;
  EmptyMsg?: React.ComponentType<{}>;
  expand?: boolean;
  fieldSelector?: string;
  filters?: {[name: string]: any};
  Header: (...args) => any[];
  label?: string;
  listId?: string;
  loaded?: boolean;
  loadError?: string | Object;
  mock?: boolean;
  namespace?: string;
  reduxID?: string;
  reduxIDs?: string[];
  Row?: RowFunction | React.ComponentClass<any, any> | React.ComponentType<any>;
  Rows?: (...args)=> any[];
  selector?: Object;
  sortList?: (listId: string, field: string, func: any, sortAsNumber: boolean, orderBy: string, column: string) => any;
  selectedResourcesForKind?: string[];
  onSelect?: (event: React.MouseEvent, isSelected: boolean, rowIndex: number, rowData: IRowData, extraData: IExtraData) => void;
  staticFilters?: any[];
  rowFilters?: any[];
  virtualize?: boolean;
};

export type TableInnerState = {
  columns?: any[];
  sortBy: object;
};
