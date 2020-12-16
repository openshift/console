import * as React from 'react';
import { connect } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
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
import { useQueryParams } from '@console/shared';
import { RootState } from '@console/internal/redux';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { ExternalLink } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { TextFilter } from '@console/internal/components/factory';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ConsoleLinkModel } from '@console/internal/models';
import { TopologyViewType } from '../topology-types';
import {
  getSupportedTopologyFilters,
  getSupportedTopologyKinds,
  onSearchChange,
} from './filter-utils';
import FilterDropdown from './FilterDropdown';
import KindFilterDropdown from './KindFilterDropdown';
import QuickSearch from '../components/quick-search/QuickSearch';
import { getNamespaceDashboardKialiLink } from '../utils/topology-utils';
import { FilterContext } from './FilterProvider';

import './TopologyFilterBar.scss';

type StateProps = {
  supportedFilters: string[];
  supportedKinds: { [key: string]: number };
  namespace: string;
};

type OwnProps = {
  visualization?: Visualization;
  viewType: TopologyViewType;
  viewContainer?: HTMLElement;
};

type TopologyFilterBarProps = StateProps & OwnProps;

const TopologyFilterBar: React.FC<TopologyFilterBarProps> = ({
  supportedFilters,
  supportedKinds,
  visualization,
  viewType,
  namespace,
  viewContainer,
}) => {
  const { t } = useTranslation();
  const { filters, setTopologyFilters: onFiltersChange } = React.useContext(FilterContext);
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const kialiLink = getNamespaceDashboardKialiLink(consoleLinks, namespace);
  const queryParams = useQueryParams();
  const searchQuery = queryParams.get('searchQuery') || '';

  const onTextFilterChange = (text) => {
    const query = text?.trim();
    onSearchChange(query);
  };

  return (
    <Toolbar className="co-namespace-bar odc-topology-filter-bar">
      <ToolbarContent>
        <ToolbarItem>
          <QuickSearch namespace={namespace} viewContainer={viewContainer} />
        </ToolbarItem>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <FilterDropdown
              filters={filters}
              viewType={viewType}
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
              placeholder={t('topology~Find by name...')}
              value={searchQuery}
              autoFocus
              onChange={onTextFilterChange}
              className="odc-topology-filter-bar__text-filter"
            />
          </ToolbarItem>
          {viewType === TopologyViewType.graph ? (
            <ToolbarItem>
              <Popover
                aria-label={t('topology~Find by name')}
                position="left"
                bodyContent={
                  <Trans ns="topology">
                    Search results may appear outside of the visible area.{' '}
                    <Button
                      variant="link"
                      onClick={() => visualization.getGraph().fit(80)}
                      isInline
                    >
                      Click here
                    </Button>{' '}
                    to fit to the screen.
                  </Trans>
                }
              >
                <Button
                  variant="link"
                  className="odc-topology-filter-bar__info-icon"
                  aria-label={t('topology~Find by name')}
                >
                  <InfoCircleIcon />
                </Button>
              </Popover>
            </ToolbarItem>
          ) : null}
        </ToolbarGroup>
        {kialiLink && (
          <ToolbarItem className="odc-topology-filter-bar__kiali-link">
            <ExternalLink href={kialiLink} text={t('topology~Kiali')} />
          </ToolbarItem>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  const states = {
    supportedFilters: getSupportedTopologyFilters(state),
    supportedKinds: getSupportedTopologyKinds(state),
    namespace: getActiveNamespace(state),
  };
  return states;
};

export default connect<StateProps>(mapStateToProps)(TopologyFilterBar);
