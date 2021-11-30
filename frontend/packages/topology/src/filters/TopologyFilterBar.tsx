import * as React from 'react';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarGroupVariant,
  ToolbarItem,
  ToolbarContent,
  Popover,
  Button,
  ToolbarFilter,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { Visualization, isNode } from '@patternfly/react-topology';
import { Trans, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ExternalLink, setQueryArgument } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { requirementFromString } from '@console/internal/module/k8s/selector-requirement';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { useQueryParams } from '@console/shared';
import ExportApplication from '../components/export-app/ExportApplication';
import TopologyQuickSearchButton from '../components/quick-search/TopologyQuickSearchButton';
import { TopologyViewType } from '../topology-types';
import { getResource } from '../utils';
import { getNamespaceDashboardKialiLink } from '../utils/topology-utils';
import {
  clearAll,
  clearLabelFilter,
  clearNameFilter,
  getSupportedTopologyFilters,
  getSupportedTopologyKinds,
  onSearchChange,
  NameLabelFilterValues,
  TOPOLOGY_LABELS_FILTER_KEY,
  TOPOLOGY_SEARCH_FILTER_KEY,
} from './filter-utils';
import FilterDropdown from './FilterDropdown';
import { FilterContext } from './FilterProvider';
import KindFilterDropdown from './KindFilterDropdown';
import NameLabelFilterDropdown from './NameLabelFilterDropdown';

import './TopologyFilterBar.scss';

type StateProps = {
  supportedFilters: string[];
  supportedKinds: { [key: string]: number };
  namespace: string;
};

type OwnProps = {
  isDisabled: boolean;
  visualization?: Visualization;
  viewType: TopologyViewType;
  setIsQuickSearchOpen: (isOpen: boolean) => void;
};

type TopologyFilterBarProps = StateProps & OwnProps;

const TopologyFilterBar: React.FC<TopologyFilterBarProps> = ({
  supportedFilters,
  supportedKinds,
  isDisabled,
  visualization,
  viewType,
  namespace,
  setIsQuickSearchOpen,
}) => {
  const { t } = useTranslation();
  const { filters, setTopologyFilters: onFiltersChange } = React.useContext(FilterContext);
  const [labelFilterInput, setLabelFilterInput] = React.useState('');
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const kialiLink = getNamespaceDashboardKialiLink(consoleLinks, namespace);
  const queryParams = useQueryParams();
  const searchQuery = queryParams.get(TOPOLOGY_SEARCH_FILTER_KEY) || '';
  const labelsQuery = queryParams.get(TOPOLOGY_LABELS_FILTER_KEY)?.split(',') || [];

  const updateNameFilter = (value: string) => {
    const query = value?.trim();
    onSearchChange(query);
  };

  const updateLabelFilter = (value: string, endOfString: boolean) => {
    setLabelFilterInput(value);
    if (requirementFromString(value) !== undefined && endOfString) {
      const updatedLabels = [...new Set([...labelsQuery, value])];
      setQueryArgument(TOPOLOGY_LABELS_FILTER_KEY, updatedLabels.join(','));
      setLabelFilterInput('');
    }
  };

  const updateSearchFilter = (type: string, value: string, endOfString: boolean) => {
    type === NameLabelFilterValues.Label
      ? updateLabelFilter(value, endOfString)
      : updateNameFilter(value);
  };

  const removeLabelFilter = (filter: string, value: string) => {
    const newLabels = labelsQuery.filter((keepItem: string) => keepItem !== value);
    newLabels.length > 0
      ? setQueryArgument(TOPOLOGY_LABELS_FILTER_KEY, newLabels.join(','))
      : clearLabelFilter();
  };

  const resources = (visualization?.getElements() || [])
    .filter(isNode)
    .map(getResource)
    .filter((r) => !!r);

  return (
    <Toolbar className="co-namespace-bar odc-topology-filter-bar" clearAllFilters={clearAll}>
      <ToolbarContent>
        <ToolbarItem>
          <TopologyQuickSearchButton onClick={() => setIsQuickSearchOpen(true)} />
        </ToolbarItem>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <FilterDropdown
              filters={filters}
              viewType={viewType}
              supportedFilters={supportedFilters}
              onChange={onFiltersChange}
              isDisabled={isDisabled}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem data-test="filter-by-resource">
            <KindFilterDropdown
              filters={filters}
              supportedKinds={supportedKinds}
              onChange={onFiltersChange}
              isDisabled={isDisabled}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <ToolbarFilter
              deleteChipGroup={clearLabelFilter}
              chips={[...labelsQuery]}
              deleteChip={removeLabelFilter}
              categoryName={t('topology~Label')}
            >
              <ToolbarFilter
                chips={searchQuery.length > 0 ? [searchQuery] : []}
                deleteChip={clearNameFilter}
                categoryName={t('topology~Name')}
              >
                <NameLabelFilterDropdown
                  onChange={updateSearchFilter}
                  nameFilterInput={searchQuery}
                  labelFilterInput={labelFilterInput}
                  data={resources}
                  isDisabled={isDisabled}
                />
              </ToolbarFilter>
            </ToolbarFilter>
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
                  isDisabled={isDisabled}
                >
                  <InfoCircleIcon />
                </Button>
              </Popover>
            </ToolbarItem>
          ) : null}
        </ToolbarGroup>
        <ToolbarGroup
          variant={ToolbarGroupVariant['button-group']}
          alignment={{ default: 'alignRight' }}
        >
          {kialiLink && (
            <ToolbarItem className="odc-topology-filter-bar__kiali-link1">
              <ExternalLink href={kialiLink} text={t('topology~Kiali')} />
            </ToolbarItem>
          )}
          <ExportApplication namespace={namespace} isDisabled={isDisabled} />
        </ToolbarGroup>
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
