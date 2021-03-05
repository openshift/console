import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect, Dispatch } from 'react-redux';
import { Accordion, AccordionContent, AccordionItem, AccordionToggle, DataToolbar, DataToolbarChip, DataToolbarContent, DataToolbarFilter, DataToolbarItem } from '@patternfly/react-core';
import { getBadgeFromType } from '@console/shared';
import { RootState } from '../../redux';
import { getActivePerspective, getPinnedResources } from '../../reducers/ui';
import { setPinnedResources } from '../../actions/ui';
import { connectToModel } from '../../kinds';
import { DefaultPage } from '../default-resource';
import { requirementFromString } from '../../module/k8s/selector-requirement';
import { ResourceListDropdown } from '../resource-dropdown';
import { resourceListPages } from '../resource-pages';
import { withStartGuide } from '../start-guide';
import { split, selectorFromString } from '../../module/k8s/selector';
import { kindForReference, modelFor, referenceForModel } from '../../module/k8s';
import { LoadingBox, MsgBox, PageHeading, ResourceIcon, setQueryArgument, AsyncComponent } from '../utils';
import { SearchFilterDropdown } from '../search-filter-dropdown';
import { useTranslation } from 'react-i18next';

const ResourceList = connectToModel(({ kindObj, mock, namespace, selector, nameFilter }) => {
  if (!kindObj) {
    return <LoadingBox />;
  }

  const componentLoader = resourceListPages.get(referenceForModel(kindObj), () => Promise.resolve(DefaultPage));
  const ns = kindObj.namespaced ? namespace : undefined;

  return <AsyncComponent loader={componentLoader} namespace={ns} selector={selector} nameFilter={nameFilter} kind={kindObj.crd ? referenceForModel(kindObj) : kindObj.kind} showTitle={false} hideTextFilter autoFocus={false} mock={mock} badge={getBadgeFromType(kindObj.badge)} hideToolbar />;
});

interface StateProps {
  perspective: string;
  pinnedResources: string[];
}

interface DispatchProps {
  onPinnedResourcesChange: (searches: string[]) => void;
}

const SearchPage_: React.FC<SearchProps & StateProps & DispatchProps> = props => {
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = React.useState(new Set<string>([]));
  const [collapsedKinds, setCollapsedKinds] = React.useState(new Set<string>([]));
  const [labelFilter, setLabelFilter] = React.useState([]);
  const [labelFilterInput, setLabelFilterInput] = React.useState('');
  const [typeaheadNameFilter, setTypeaheadNameFilter] = React.useState('');
  const { namespace, noProjectsAvailable } = props;

  // Set state variables from the URL
  React.useEffect(() => {
    let kind: string, q: string, name: string;

    if (window.location.search) {
      const sp = new URLSearchParams(window.location.search);
      kind = sp.get('kind');
      q = sp.get('q');
      name = sp.get('name');
    }
    // Ensure that the "kind" route parameter is a valid resource kind ID
    kind = kind || '';
    if (kind !== '') {
      setSelectedItems(new Set(kind.split(',')));
    }
    const tags = split(q || '');
    const validTags = _.reject(tags, tag => requirementFromString(tag) === undefined);
    setLabelFilter(validTags);
    setTypeaheadNameFilter(name || '');
  }, []);

  const updateSelectedItems = (selection: string) => {
    const updateItems = selectedItems;
    updateItems.has(selection) ? updateItems.delete(selection) : updateItems.add(selection);
    setSelectedItems(updateItems);
    setQueryArgument('kind', [...updateItems].join(','));
  };

  const updateNewItems = (filter: string, { key }: DataToolbarChip) => {
    const updateItems = selectedItems;
    updateItems.has(key) ? updateItems.delete(key) : updateItems.add(key);
    setSelectedItems(updateItems);
    setQueryArgument('kind', [...updateItems].join(','));
  };

  const clearSelectedItems = () => {
    setSelectedItems(new Set([]));
    setQueryArgument('kind', '');
  };

  const clearNameFilter = () => {
    setTypeaheadNameFilter('');
    setQueryArgument('name', '');
  };

  const clearLabelFilter = () => {
    setLabelFilter([]);
    setQueryArgument('q', '');
  };

  const clearAll = () => {
    clearSelectedItems();
    clearNameFilter();
    clearLabelFilter();
  };

  const toggleKindExpanded = (kindView: string) => {
    const newCollasped = new Set(collapsedKinds);
    newCollasped.has(kindView) ? newCollasped.delete(kindView) : newCollasped.add(kindView);
    setCollapsedKinds(newCollasped);
  };

  const updateNameFilter = (value: string) => {
    setTypeaheadNameFilter(value);
    setQueryArgument('name', value);
  };

  const updateLabelFilter = (value: string, endOfString: boolean) => {
    setLabelFilterInput(value);
    if (requirementFromString(value) !== undefined && endOfString) {
      const updatedLabels = _.uniq([...labelFilter, value]);
      setLabelFilter(updatedLabels);
      setQueryArgument('q', updatedLabels.join(','));
      setLabelFilterInput('');
    }
  };

  const updateSearchFilter = (type: string, value: string, endOfString: boolean) => {
    type === t('COMMON:MSG_COMMON_SEARCH_FILTER_2') ? updateLabelFilter(value, endOfString) : updateNameFilter(value);
  };

  const removeLabelFilter = (filter: string, value: string) => {
    const newLabels = labelFilter.filter((keepItem: string) => keepItem !== value);
    setLabelFilter(newLabels);
    setQueryArgument('q', newLabels.join(','));
  };

  const getToggleText = (item: string) => {
    const model = modelFor(item);
    // API discovery happens asynchronously. Avoid runtime errors if the model hasn't loaded.
    if (!model) {
      return '';
    }
    const { labelPlural, apiVersion, apiGroup } = model;
    return (
      <span className="co-search-group__accordion-label">
        {labelPlural}{' '}
        <span className="text-muted show small">
          {apiGroup || 'core'}/{apiVersion}
        </span>
      </span>
    );
  };

  return (
    <>
      <Helmet>
        <title>{t('COMMON:MSG_LNB_MENU_4')}</title>
      </Helmet>
      <PageHeading detail={true} title={t('COMMON:MSG_LNB_MENU_4')}>
        <DataToolbar id="search-toolbar" clearAllFilters={clearAll} clearFiltersButtonText={t('COMMON:MSG_COMMON_FILTER_11')}>
          <DataToolbarContent>
            <DataToolbarItem>
              <DataToolbarFilter
                deleteChipGroup={clearSelectedItems}
                chips={[...selectedItems].map(resourceKind => ({
                  key: resourceKind,
                  node: (
                    <>
                      <ResourceIcon kind={resourceKind} />
                      {kindForReference(resourceKind)}
                    </>
                  ),
                }))}
                deleteChip={updateNewItems}
                categoryName={t('COMMON:MSG_COMMON_FILTER_1')}
              >
                <ResourceListDropdown selected={[...selectedItems]} onChange={updateSelectedItems} type="multiple" />
              </DataToolbarFilter>
            </DataToolbarItem>
            <DataToolbarItem className="co-search-group__filter">
              <DataToolbarFilter deleteChipGroup={clearLabelFilter} chips={[...labelFilter]} deleteChip={removeLabelFilter} categoryName={t('COMMON:MSG_COMMON_SEARCH_FILTER_2')}>
                <DataToolbarFilter chips={typeaheadNameFilter.length > 0 ? [typeaheadNameFilter] : []} deleteChip={clearNameFilter} categoryName={t('COMMON:MSG_COMMON_SEARCH_FILTER_1')}>
                  <SearchFilterDropdown onChange={updateSearchFilter} nameFilterInput={typeaheadNameFilter} labelFilterInput={labelFilterInput} />
                </DataToolbarFilter>
              </DataToolbarFilter>
            </DataToolbarItem>
          </DataToolbarContent>
        </DataToolbar>
      </PageHeading>
      <div className="co-search">
        <Accordion className="co-search__accordion" asDefinitionList={false} noBoxShadow>
          {[...selectedItems].map(resource => {
            const isCollapsed = collapsedKinds.has(resource);
            return (
              <AccordionItem key={resource}>
                <AccordionToggle className="co-search-group__accordion-toggle" onClick={() => toggleKindExpanded(resource)} isExpanded={!isCollapsed} id={`${resource}-toggle`}>
                  {getToggleText(resource)}
                </AccordionToggle>
                <AccordionContent isHidden={isCollapsed}>{!isCollapsed && <ResourceList kind={resource} selector={selectorFromString(labelFilter.join(','))} nameFilter={typeaheadNameFilter} namespace={namespace} mock={noProjectsAvailable} key={resource} />}</AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        {selectedItems.size === 0 && <MsgBox title={t('SINGLE:MSG_SEARCH_MAIN_NORESOURCES_1')} detail={<p>{t('SINGLE:MSG_SEARCH_MAIN_NORESOURCES_2')}</p>} />}
      </div>
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  perspective: getActivePerspective(state),
  pinnedResources: getPinnedResources(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onPinnedResourcesChange: (searches: string[]) => {
    dispatch(setPinnedResources(searches));
  },
});

export const SearchPage = connect(mapStateToProps, mapDispatchToProps)(withStartGuide(SearchPage_));

export type SearchProps = {
  location: any;
  namespace: string;
  noProjectsAvailable: boolean;
};
