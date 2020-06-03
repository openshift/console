import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { PageHeaderTools, PageHeaderToolsGroup, PageHeaderToolsItem, Popover, Button } from '@patternfly/react-core';
import { RootState } from '@console/internal/redux';
import { TextFilter } from '@console/internal/components/factory';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { Visualization } from '@console/topology';
import { setTopologyFilters } from '../redux/action';
import { TopologyFilters, DisplayFilters } from './filter-types';
import { getTopologyFilters, getTopologySearchQuery } from './filter-utils';

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
  onSearchChange: (searchQuery: string) => void;
};

type MergeProps = {
  onDisplayFiltersChange: (display: DisplayFilters) => void;
} & StateProps &
  OwnProps;

type TopologyFilterBarProps = MergeProps;

const TopologyFilterBar: React.FC<TopologyFilterBarProps> = ({
  filters: { display },
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
    <PageHeaderTools className="co-namespace-bar odc-topology-filter-bar">
      <PageHeaderToolsGroup>
        <PageHeaderToolsItem>
          <FilterDropdown filters={display} onChange={onDisplayFiltersChange} />
        </PageHeaderToolsItem>
      </PageHeaderToolsGroup>
      <PageHeaderToolsGroup className="odc-topology-filter-bar__search">
        <PageHeaderToolsItem>
          <TextFilter
            placeholder="Find by name..."
            value={searchQuery}
            autoFocus
            onChange={onTextFilterChange}
          />
        </PageHeaderToolsItem>
        <PageHeaderToolsItem>
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
        </PageHeaderToolsItem>
      </PageHeaderToolsGroup>
    </PageHeaderTools>
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
  { visualization, onSearchChange }: OwnProps,
): MergeProps => ({
  filters,
  onDisplayFiltersChange: (display: DisplayFilters) => {
    onFiltersChange({ ...filters, display });
  },
  onSearchChange,
  visualization,
});

export default connect<StateProps, DispatchProps, OwnProps, MergeProps>(
  mapStateToProps,
  dispatchToProps,
  mergeProps,
)(TopologyFilterBar);
