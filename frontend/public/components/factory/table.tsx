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
  TableBody,
  TableGridBreakpoint,
  SortByDirection,
} from '@patternfly/react-table';

import { filterPropType } from './table-filters';
import { tableStateToProps } from './table-sorts';

type TableOwnProps = {
  customData?: object;
  data?: any[];
  defaultSortFunc?: string;
  defaultSortField?: string;
  filters?: {[key: string]: any};
  Header: (...args) => any[];
  loadError?: string | Object;
  Rows?: (...args)=> any[];
  'aria-label': string;
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

/**
 * Important: All Detail Table documentation follows the @patternfly/react-table APIs
 * Documentation here: https://patternfly-react.surge.sh/patternfly-4/components/table/
 */

export const Table = connect<TablePropsFromState,TablePropsFromDispatch,TableOwnProps,TableOptionProps>(
  tableStateToProps,
  {sortList: UIActions.sortList},
  null,
  {areStatesEqual: ({UI: next}, {UI: prev}) => next.get('listSorts') === prev.get('listSorts')}
)(
  class TableInner extends React.Component<TableInnerProps, TableInnerState> {
    static propTypes = {
      customData: PropTypes.object,
      data: PropTypes.array,
      EmptyMsg: PropTypes.func,
      expand: PropTypes.bool,
      fieldSelector: PropTypes.string,
      filters: filterPropType,
      Header: PropTypes.func.isRequired,
      Rows: PropTypes.func,
      loaded: PropTypes.bool,
      loadError: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
      mock: PropTypes.bool,
      namespace: PropTypes.string,
      reduxID: PropTypes.string,
      reduxIDs: PropTypes.array,
      selector: PropTypes.object,
      staticFilters: PropTypes.array,
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
      this._columnShift = props.onSelect ? 1 : 0; //shift indexes by 1 if select provided
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
      const {Rows, label, mock, onSelect, 'aria-label': ariaLabel, customData} = this.props;
      const {sortBy, columns} = this.state;
      const componentProps: any = _.pick(this.props, ['data', 'filters', 'selected', 'match', 'kindObj']);

      const children = mock ? <EmptyBox label={label} /> : (
        <PfTable
          cells={columns}
          rows={Rows({componentProps, customData})}
          gridBreakPoint={TableGridBreakpoint.gridMd}
          onSort={this._onSort}
          onSelect={onSelect}
          sortBy={sortBy}
          className="pf-m-compact pf-m-border-rows"
          role={'grid'}
          aria-label={ariaLabel}
        >
          <TableHeader />
          <TableBody />
        </PfTable>
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
  Rows?: (...args)=> any[];
  selector?: Object;
  sortList?: (listId: string, field: string, func: any, orderBy: string, column: string) => any;
  onSelect?: (event: React.MouseEvent, isSelected: boolean, rowIndex: number, rowData: IRowData, extraData: IExtraData) => void;
  staticFilters?: any[];
  rowFilters?: any[];
};

export type TableInnerState = {
  columns?: any[];
  sortBy: object;
};
