import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';

import * as UIActions from '../../actions/ui';
import { EmptyBox, StatusBox } from '../utils';

import {
  IRowData, // eslint-disable-line no-unused-vars
  IExtraData, // eslint-disable-line no-unused-vars
  Table as PfTable,
  TableHeader,
  TableGridBreakpoint,
  SortByDirection,
} from '@patternfly/react-table';

import { CellMeasurerCache, CellMeasurer} from 'react-virtualized';

import {
  AutoSizer,
  VirtualTableBody,
  WindowScroller,
} from '@patternfly/react-virtualized-extension';

import { filterPropType } from './table-filters';
import { tableStateToProps } from './table-sorts';

// Common table row/columns helper SFCs for implementing accessible data grid
export const VirtualTableRow: React.SFC<VirtualTableRowProps> = ({id, index, trKey, style, className, ...props}) => {
  return (
    <tr {...props} data-id={id} data-index={index} data-test-rows="resource-row" data-key={trKey} style={style} className={className} role="row" />
  );
};
VirtualTableRow.displayName = 'VirtualTableRow';
export type VirtualTableRowProps = {
  id: any;
  index: number;
  trKey: string;
  style: object;
  className?: string;
}

export const VirtualTableData: React.SFC<VirtualTableDataProps> = ({className, ...props}) => {
  return (
    <td {...props} className={className} role="gridcell" />
  );
};
VirtualTableData.displayName = 'VirtualTableData';
export type VirtualTableDataProps = {
  id?: string;
  className?: string;
}

const VirtualTableWrapper: React.SFC<VirtualTableWrapperProps> = ({ariaLabel, ariaRowCount, ...props}) => {
  return <div {...props} role="grid" aria-label={ariaLabel} aria-rowcount={ariaRowCount} />;
};
export type VirtualTableWrapperProps = {
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

type VirtualTableOwnProps = {
  customData?: object;
  data?: any[];
  defaultSortFunc?: string;
  defaultSortField?: string;
  filters?: {[key: string]: any};
  Header: (...args) => any[];
  loadError?: string | Object;
  Row?: RowFunction | React.ComponentClass<any, any> | React.ComponentType<any>;
  'aria-label': string;
  virtualize?: boolean;
  EmptyMsg?: React.ComponentType<{}>;
  loaded?: boolean;
  reduxID?: string;
  reduxIDs?: string[];
}

type VirtualTablePropsFromState = {};

type VirtualTablePropsFromDispatch = {};

type VirtualTableOptionProps = {
  UI: any;
}

/**
 * Important: All Table documentation follows the @patternfly/react-virtualized-extension APIs
 * Documentation here: https://patternfly-react.surge.sh/patternfly-4/virtual%20scroll/virtualized/
 */

export const VirtualTable = connect<VirtualTablePropsFromState,VirtualTablePropsFromDispatch,VirtualTableOwnProps,VirtualTableOptionProps>(
  tableStateToProps,
  {sortList: UIActions.sortList},
  null,
  {areStatesEqual: ({UI: next}, {UI: prev}) => next.get('listSorts') === prev.get('listSorts')}
)(
  class VirtualTableInner extends React.Component<VirtualTableInnerProps, VirtualTableInnerState> {
    static propTypes = {
      customData: PropTypes.object,
      data: PropTypes.array,
      EmptyMsg: PropTypes.func,
      expand: PropTypes.bool,
      fieldSelector: PropTypes.string,
      filters: filterPropType,
      Header: PropTypes.func.isRequired,
      Row: PropTypes.func,
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
      //sort by first column
      this.state = {
        columns,
        sortBy: {},
      };
      this._applySort = this._applySort.bind(this);
      this._onSort = this._onSort.bind(this);
      this._handleResize = this._handleResize.bind(this);
      this._bindBodyRef = this._bindBodyRef.bind(this);
      this._refreshGrid = this._refreshGrid.bind(this);
      this._columnShift = props.onSelect ? 1 : 0; //shift indexes by 1 if select provided

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
        this._applySort(column.sortField, column.sortFunc, sortOrder, column.title);
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
      const {data} = this.props;
      if (this._bodyRef && !_.isEqual(prevProps.data, data)){
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
      if (this._bodyRef){
        this._refreshGrid();
      }
    }

    _bindBodyRef(ref) {
      this._bodyRef = ref;
    }

    _applySort(sortField, sortFunc, direction, columnTitle){
      const {sortList, listId, currentSortFunc} = this.props;
      const applySort = _.partial(sortList, listId);
      applySort(sortField, sortFunc || currentSortFunc, direction, columnTitle);
    }

    _onSort(_event, index, direction){
      const sortColumn = this.state.columns[index - this._columnShift];
      this._applySort(sortColumn.sortField, sortColumn.sortFunc, direction, sortColumn.title);
      this.setState({
        sortBy: {
          index,
          direction,
        },
      });
    }

    render() {
      const {Row, expand, label, mock, onSelect, 'aria-label': ariaLabel, customData} = this.props;
      const {sortBy, columns} = this.state;
      const componentProps: any = _.pick(this.props, ['data', 'filters', 'selected', 'match', 'kindObj']);
      const ariaRowCount = componentProps.data && componentProps.data.length;

      const children = mock ? <EmptyBox label={label} /> : (
        <VirtualTableWrapper ariaLabel={ariaLabel} ariaRowCount={ariaRowCount}>
          <PfTable
            cells={columns}
            rows={[]}
            gridBreakPoint={TableGridBreakpoint.none}
            onSort={this._onSort}
            onSelect={onSelect}
            sortBy={sortBy}
            className="pf-m-compact pf-m-border-rows"
            role={'presentation'}
            aria-label={null}
          >
            <TableHeader />
          </PfTable>
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
        </VirtualTableWrapper>
      );
      return <div className="co-m-table-grid co-m-table-grid--bordered">
        { mock
          ? children
          : <StatusBox skeleton={<div className="loading-skeleton--table" />} {...this.props}>{children}</StatusBox> }
      </div>;
    }
  });


export type VirtualTableInnerProps = {
  'aria-label': string;
  customData?: object;
  currentSortField?: string;
  currentSortFunc?: string;
  currentSortOrder?: any;
  data?: any[];
  defaultSortField?: string;
  defaultSortFunc?: string;
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
  selector?: Object;
  sortList?: (listId: string, field: string, func: any, orderBy: string, column: string) => any;
  onSelect?: (event: React.MouseEvent, isSelected: boolean, rowIndex: number, rowData: IRowData, extraData: IExtraData) => void;
  staticFilters?: any[];
  rowFilters?: any[];
  virtualize?: boolean;
};

export type VirtualTableInnerState = {
  columns?: any[];
  sortBy: object;
};
