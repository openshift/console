import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { Popover, Button, ToolbarGroup, ToolbarContent } from '@patternfly/react-core';
import { RootState } from '@console/internal/redux';
import { TextFilter } from '@console/internal/components/factory';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { Visualization } from '@console/topology';
import { setTopologyFilters } from '../redux/action';
import { DisplayFilters } from '../topology-types';
import {
  getSupportedTopologyFilters,
  getTopologyFilters,
  getTopologySearchQuery,
} from './filter-utils';

import FilterDropdown from './FilterDropdown';
import './TopologyFilterBar.scss';

type StateProps = {
  filters: DisplayFilters;
  supportedFilters: string[];
};

type DispatchProps = {
  onFiltersChange: (filters: DisplayFilters) => void;
};

type OwnProps = {
  visualization: Visualization;
  onSearchChange: (searchQuery: string) => void;
};

type MergeProps = {
  onDisplayFiltersChange: (display: DisplayFilters) => void;
} & StateProps &
  OwnProps;

type TopologyFilterBarProps = MergeProps;

const TopologyFilterBar: React.FC<TopologyFilterBarProps> = ({
  filters,
  supportedFilters,
  onDisplayFiltersChange,
  onSearchChange,
  visualization,
}) => {
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  React.useEffect(() => {
    const query = getTopologySearchQuery();
    setSearchQuery(query);
  }, []);

  const onTextFilterChange = React.useCallback(
    (text) => {
      const query = text?.trim();
      setSearchQuery(query);
      onSearchChange(query);
    },
    [onSearchChange],
  );

  return (
    <ToolbarContent className="co-namespace-bar odc-topology-filter-bar">
      <ToolbarGroup>
        <FilterDropdown
          filters={filters}
          supportedFilters={supportedFilters}
          onChange={onDisplayFiltersChange}
        />
      </ToolbarGroup>
      <ToolbarGroup className="odc-topology-filter-bar__search">
        <TextFilter
          placeholder="Find by name..."
          value={searchQuery}
          autoFocus
          onChange={onTextFilterChange}
        />
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
      </ToolbarGroup>
    </ToolbarContent>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  filters: getTopologyFilters(state),
  supportedFilters: getSupportedTopologyFilters(state),
});

const dispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onFiltersChange: (filters: DisplayFilters) => {
    dispatch(setTopologyFilters(filters));
  },
});

const mergeProps = (
  { filters, supportedFilters }: StateProps,
  { onFiltersChange }: DispatchProps,
  { visualization, onSearchChange }: OwnProps,
): MergeProps => ({
  filters,
  supportedFilters,
  onDisplayFiltersChange: (changedFilters: DisplayFilters) => {
    onFiltersChange(changedFilters);
  },
  onSearchChange,
  visualization,
});

export default connect<StateProps, DispatchProps, OwnProps, MergeProps>(
  mapStateToProps,
  dispatchToProps,
  mergeProps,
)(TopologyFilterBar);
