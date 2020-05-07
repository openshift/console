import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { Toolbar, ToolbarGroup, ToolbarItem, Popover, Button } from '@patternfly/react-core';
import { RootState } from '@console/internal/redux';
import { TextFilter } from '@console/internal/components/factory';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { Visualization } from '@console/topology';
import { setQueryArgument, removeQueryArgument } from '@console/internal/components/utils';
import { setTopologyFilters } from '../redux/action';
import { TOPOLOGY_SEARCH_FILTER_KEY } from '../redux/const';
import { TopologyFilters, DisplayFilters, getTopologyFilters } from './filter-utils';
import FilterDropdown from './FilterDropdown';
import './TopologyFilterBar.scss';

type StateProps = {
  filters: TopologyFilters;
};

type DispatchProps = {
  onFiltersChange: (filters: TopologyFilters) => void;
};

type OwnProps = {
  visualization: Visualization;
};

type MergeProps = {
  onDisplayFiltersChange: (display: DisplayFilters) => void;
  onSearchQueryChange: (searchQuery: string) => void;
} & StateProps &
  OwnProps;

type TopologyFilterBarProps = MergeProps;

const TopologyFilterBar: React.FC<TopologyFilterBarProps> = ({
  filters: { display, searchQuery },
  onDisplayFiltersChange,
  onSearchQueryChange,
  visualization,
}) => {
  return (
    <Toolbar className="co-namespace-bar odc-topology-filter-bar">
      <ToolbarGroup>
        <ToolbarItem>
          <FilterDropdown filters={display} onChange={onDisplayFiltersChange} />
        </ToolbarItem>
      </ToolbarGroup>
      <ToolbarGroup className="odc-topology-filter-bar__search">
        <ToolbarItem>
          <TextFilter
            placeholder="Find by name..."
            value={searchQuery}
            autoFocus
            onChange={onSearchQueryChange}
          />
        </ToolbarItem>
        <ToolbarItem>
          <Popover
            aria-label="Find by name"
            position="left"
            bodyContent={
              <>
                Search results may appear outside of the visible area.{' '}
                <Button variant="link" onClick={() => visualization.getGraph().fit(80)} isInline>
                  Click here
                </Button>{' '}
                to fit to the screen.
              </>
            }
          >
            <Button variant="link" className="odc-topology-filter-bar__info-icon" isInline>
              <InfoCircleIcon />
            </Button>
          </Popover>
        </ToolbarItem>
      </ToolbarGroup>
    </Toolbar>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  filters: getTopologyFilters(state),
});

const dispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onFiltersChange: (filters: TopologyFilters) => {
    dispatch(setTopologyFilters(filters));
  },
});

const mergeProps = (
  { filters }: StateProps,
  { onFiltersChange }: DispatchProps,
  { visualization }: OwnProps,
): MergeProps => ({
  filters,
  onDisplayFiltersChange: (display: DisplayFilters) => {
    onFiltersChange({ ...filters, display });
  },
  onSearchQueryChange: (searchQuery) => {
    onFiltersChange({ ...filters, searchQuery });
    if (searchQuery.length > 0) {
      setQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY, searchQuery);
    } else {
      removeQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY);
    }
  },
  visualization,
});

export default connect<StateProps, DispatchProps, OwnProps, MergeProps>(
  mapStateToProps,
  dispatchToProps,
  mergeProps,
)(TopologyFilterBar);
