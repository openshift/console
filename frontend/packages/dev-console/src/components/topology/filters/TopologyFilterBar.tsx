import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import { RootState } from '@console/internal/redux';
import { TextFilter } from '@console/internal/components/factory';
import { setTopologyFilters } from '../redux/action';
import FilterDropdown from './FilterDropdown';
import { TopologyFilters, DisplayFilters, getTopologyFilters } from './filter-utils';
import './TopologyFilterBar.scss';

type StateProps = {
  filters: TopologyFilters;
};

type DispatchProps = {
  onFiltersChange: (filters: TopologyFilters) => void;
};

type MergeProps = {
  onDisplayFiltersChange: (display: DisplayFilters) => void;
  onSearchQueryChange: (searchQuery: string) => void;
} & StateProps;

type TopologyFilterBarProps = MergeProps;

const TopologyFilterBar: React.FC<TopologyFilterBarProps> = ({
  filters: { display, searchQuery },
  onDisplayFiltersChange,
  onSearchQueryChange,
}) => (
  <Toolbar className="co-namespace-bar odc-topology-filter-bar">
    <ToolbarGroup>
      <ToolbarItem>
        <FilterDropdown filters={display} onChange={onDisplayFiltersChange} />
      </ToolbarItem>
    </ToolbarGroup>
    <ToolbarGroup className="odc-topology-filter-bar__search">
      <ToolbarItem>
        <TextFilter
          label="name"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
      </ToolbarItem>
    </ToolbarGroup>
  </Toolbar>
);

const mapStateToProps = (state: RootState): StateProps => ({
  filters: getTopologyFilters(state),
});

const dispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onFiltersChange: (filters: TopologyFilters) => {
    dispatch(setTopologyFilters(filters));
  },
});

const mergeProps = ({ filters }: StateProps, { onFiltersChange }: DispatchProps): MergeProps => ({
  filters,
  onDisplayFiltersChange: (display: DisplayFilters) => {
    onFiltersChange({ ...filters, display });
  },
  onSearchQueryChange: (searchQuery) => {
    onFiltersChange({ ...filters, searchQuery });
  },
});

export default connect(mapStateToProps, dispatchToProps, mergeProps)(TopologyFilterBar);
