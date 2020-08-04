import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarGroupVariant,
  ToolbarItem,
  ToolbarContent,
} from '@patternfly/react-core';
import { Visualization } from '@patternfly/react-topology';
import { RootState } from '@console/internal/redux';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { ExternalLink } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { setTopologyFilters } from '../redux/action';
import { DisplayFilters } from '../topology-types';
import {
  getSupportedTopologyFilters,
  getSupportedTopologyKinds,
  getTopologyFilters,
} from './filter-utils';
import FilterDropdown from './FilterDropdown';
import KindFilterDropdown from './KindFilterDropdown';
import { getNamespaceDashboardKialiLink } from '../topology-utils';

import './TopologyFilterBar.scss';
import { TopologySearchFilter } from './TopologySearchFilter';

type StateProps = {
  filters: DisplayFilters;
  supportedFilters: string[];
  supportedKinds: { [key: string]: number };
  consoleLinks: K8sResourceKind[];
  namespace: string;
};

type DispatchProps = {
  onFiltersChange: (filters: DisplayFilters) => void;
};

type OwnProps = {
  visualization?: Visualization;
  onSearchChange: (searchQuery: string, searchType: string) => void;
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
  supportedKinds,
  onDisplayFiltersChange,
  onSearchChange,
  visualization,
  showGraphView,
  consoleLinks,
  namespace,
}) => {
  const kialiLink = getNamespaceDashboardKialiLink(consoleLinks, namespace);

  return (
    <Toolbar className="co-namespace-bar odc-topology-filter-bar">
      <ToolbarContent>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <FilterDropdown
              filters={filters}
              supportedFilters={supportedFilters}
              onChange={onDisplayFiltersChange}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <KindFilterDropdown
              filters={filters}
              supportedKinds={supportedKinds}
              onChange={onDisplayFiltersChange}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <TopologySearchFilter
          showGraphView={showGraphView}
          visualization={visualization}
          onSearchChange={onSearchChange}
        />
        {kialiLink && (
          <ToolbarItem className="odc-topology-filter-bar__kiali-link">
            <ExternalLink href={kialiLink} text="Kiali" />
          </ToolbarItem>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  filters: getTopologyFilters(state),
  supportedFilters: getSupportedTopologyFilters(state),
  supportedKinds: getSupportedTopologyKinds(state),
  consoleLinks: state.UI.get('consoleLinks'),
  namespace: getActiveNamespace(state),
});

const dispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onFiltersChange: (filters: DisplayFilters) => {
    dispatch(setTopologyFilters(filters));
  },
});

const mergeProps = (
  { filters, supportedFilters, supportedKinds, consoleLinks, namespace }: StateProps,
  { onFiltersChange }: DispatchProps,
  { visualization, onSearchChange, showGraphView }: OwnProps,
): MergeProps => ({
  filters,
  supportedFilters,
  supportedKinds,
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
