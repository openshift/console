import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { ToolbarGroup, ToolbarContent, Popover, Button } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { Visualization } from '@patternfly/react-topology';
import { RootState } from '@console/internal/redux';
import { TextFilter } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { setTopologyFilters } from '../redux/action';
import { DisplayFilters } from '../topology-types';
import {
  getSupportedTopologyFilters,
  getTopologyFilters,
  getTopologySearchQuery,
} from './filter-utils';

import FilterDropdown from './FilterDropdown';
import './TopologyFilterBar.scss';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { getNamespaceDashboardKialiLink } from '../topology-utils';
import { ExternalLink } from '@console/internal/components/utils';

type StateProps = {
  filters: DisplayFilters;
  supportedFilters: string[];
  consoleLinks: K8sResourceKind[];
  namespace: string;
};

type DispatchProps = {
  onFiltersChange: (filters: DisplayFilters) => void;
};

type OwnProps = {
  visualization?: Visualization;
  onSearchChange: (searchQuery: string) => void;
  showGraphView: boolean;
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
  showGraphView,
  consoleLinks,
  namespace,
}) => {
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const kialiLink = getNamespaceDashboardKialiLink(consoleLinks, namespace);
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
        <TextFilter
          placeholder="Find by name..."
          value={searchQuery}
          autoFocus
          onChange={onTextFilterChange}
          className="odc-topology-filter-bar__text-filter"
        />
        {showGraphView && (
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
            <Button variant="link" className="odc-topology-filter-bar__info-icon">
              <InfoCircleIcon />
            </Button>
          </Popover>
        )}
      </ToolbarGroup>
      {kialiLink && (
        <ToolbarGroup className="odc-topology-filter-bar__kiali-link">
          <ExternalLink href={kialiLink} text="Kiali" />
        </ToolbarGroup>
      )}
    </ToolbarContent>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  filters: getTopologyFilters(state),
  supportedFilters: getSupportedTopologyFilters(state),
  consoleLinks: state.UI.get('consoleLinks'),
  namespace: getActiveNamespace(state),
});

const dispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onFiltersChange: (filters: DisplayFilters) => {
    dispatch(setTopologyFilters(filters));
  },
});

const mergeProps = (
  { filters, supportedFilters, consoleLinks, namespace }: StateProps,
  { onFiltersChange }: DispatchProps,
  { visualization, onSearchChange, showGraphView }: OwnProps,
): MergeProps => ({
  filters,
  supportedFilters,
  consoleLinks,
  namespace,
  onDisplayFiltersChange: (changedFilters: DisplayFilters) => {
    onFiltersChange(changedFilters);
  },
  onSearchChange,
  visualization,
  showGraphView,
});

export default connect<StateProps, DispatchProps, OwnProps, MergeProps>(
  mapStateToProps,
  dispatchToProps,
  mergeProps,
)(TopologyFilterBar);
