import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarGroupVariant,
  ToolbarItem,
  ToolbarContent,
  Popover,
  Button,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { Visualization } from '@patternfly/react-topology';
import { RootState } from '@console/internal/redux';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { ExternalLink } from '@console/internal/components/utils';
import { TextFilter } from '@console/internal/components/factory';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { setTopologyFilters } from '../redux/action';
import { DisplayFilters } from '../topology-types';
import {
  getSupportedTopologyFilters,
  getSupportedTopologyKinds,
  getTopologyFilters,
  getTopologySearchQuery,
  onSearchChange,
} from './filter-utils';
import FilterDropdown from './FilterDropdown';
import KindFilterDropdown from './KindFilterDropdown';
import { getNamespaceDashboardKialiLink } from '../topology-utils';

import './TopologyFilterBar.scss';

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
  showGraphView: boolean;
};

type MergeProps = StateProps & DispatchProps & OwnProps;

type TopologyFilterBarProps = MergeProps;

const TopologyFilterBar: React.FC<TopologyFilterBarProps> = ({
  filters,
  supportedFilters,
  supportedKinds,
  onFiltersChange,
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

  const onTextFilterChange = (text) => {
    const query = text?.trim();
    setSearchQuery(query);
    onSearchChange(query);
  };

  return (
    <Toolbar className="co-namespace-bar odc-topology-filter-bar">
      <ToolbarContent>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <FilterDropdown
              filters={filters}
              showGraphView={showGraphView}
              supportedFilters={supportedFilters}
              onChange={onFiltersChange}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <KindFilterDropdown
              filters={filters}
              supportedKinds={supportedKinds}
              onChange={onFiltersChange}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <TextFilter
              placeholder="Find by name..."
              value={searchQuery}
              autoFocus
              onChange={onTextFilterChange}
              className="odc-topology-filter-bar__text-filter"
            />
          </ToolbarItem>
          {showGraphView ? (
            <ToolbarItem>
              <Popover
                aria-label="Find by name"
                position="left"
                bodyContent={
                  <>
                    Search results may appear outside of the visible area.{' '}
                    <Button
                      variant="link"
                      onClick={() => visualization.getGraph().fit(80)}
                      isInline
                    >
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
            </ToolbarItem>
          ) : null}
        </ToolbarGroup>
        {kialiLink && (
          <ToolbarItem className="odc-topology-filter-bar__kiali-link">
            <ExternalLink href={kialiLink} text="Kiali" />
          </ToolbarItem>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  const states = {
    filters: getTopologyFilters(state),
    supportedFilters: getSupportedTopologyFilters(state),
    supportedKinds: getSupportedTopologyKinds(state),
    consoleLinks: state.UI.get('consoleLinks'),
    namespace: getActiveNamespace(state),
  };
  return states;
};

const dispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onFiltersChange: (filters: DisplayFilters) => {
    dispatch(setTopologyFilters(filters));
  },
});

const mergeProps = (
  { filters, supportedFilters, supportedKinds, consoleLinks, namespace }: StateProps,
  { onFiltersChange }: DispatchProps,
  { visualization, showGraphView }: OwnProps,
): MergeProps => ({
  filters,
  supportedFilters,
  supportedKinds,
  consoleLinks,
  namespace,
  onFiltersChange,
  visualization,
  showGraphView,
});

export default connect<StateProps, DispatchProps, OwnProps, MergeProps>(
  mapStateToProps,
  dispatchToProps,
  mergeProps,
)(TopologyFilterBar);
