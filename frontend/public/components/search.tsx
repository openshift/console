import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect, Dispatch } from 'react-redux';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Button,
  ButtonVariant,
  Toolbar,
  ToolbarChip,
  ToolbarContent,
  ToolbarFilter,
  ToolbarItem,
} from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import { getBadgeFromType } from '@console/shared';
import { RootState } from '../redux';
import { getActivePerspective, getPinnedResources } from '../reducers/ui';
import { setPinnedResources } from '../actions/ui';
import { connectToModel } from '../kinds';
import { DefaultPage } from './default-resource';
import { requirementFromString } from '../module/k8s/selector-requirement';
import { ResourceListDropdown } from './resource-dropdown';
import { getResourceListPages } from './resource-pages';
import { withStartGuide } from './start-guide';
import { split, selectorFromString } from '../module/k8s/selector';
import { kindForReference, modelFor, referenceForModel } from '../module/k8s';
import {
  LoadingBox,
  MsgBox,
  PageHeading,
  ResourceIcon,
  setQueryArgument,
  AsyncComponent,
} from './utils';
import confirmNavUnpinModal from './nav/confirmNavUnpinModal';
import { SearchFilterDropdown, searchFilterValues } from './search-filter-dropdown';
import { useExtensions, isResourceListPage, ResourceListPage } from '@console/plugin-sdk';

const ResourceList = connectToModel(({ kindObj, mock, namespace, selector, nameFilter }) => {
  const resourceListPageExtensions = useExtensions<ResourceListPage>(isResourceListPage);
  if (!kindObj) {
    return <LoadingBox />;
  }

  const componentLoader = getResourceListPages(resourceListPageExtensions).get(
    referenceForModel(kindObj),
    () => Promise.resolve(DefaultPage),
  );
  const ns = kindObj.namespaced ? namespace : undefined;

  return (
    <AsyncComponent
      loader={componentLoader}
      namespace={ns}
      selector={selector}
      nameFilter={nameFilter}
      kind={kindObj.crd ? referenceForModel(kindObj) : kindObj.kind}
      showTitle={false}
      hideTextFilter
      autoFocus={false}
      mock={mock}
      badge={getBadgeFromType(kindObj.badge)}
      hideNameLabelFilters
      hideColumnManagement
    />
  );
});

interface StateProps {
  perspective: string;
  pinnedResources: string[];
}

interface DispatchProps {
  onPinnedResourcesChange: (searches: string[]) => void;
}

const SearchPage_: React.FC<SearchProps & StateProps & DispatchProps> = (props) => {
  const [selectedItems, setSelectedItems] = React.useState(new Set<string>([]));
  const [collapsedKinds, setCollapsedKinds] = React.useState(new Set<string>([]));
  const [labelFilter, setLabelFilter] = React.useState([]);
  const [labelFilterInput, setLabelFilterInput] = React.useState('');
  const [typeaheadNameFilter, setTypeaheadNameFilter] = React.useState('');
  const { namespace, noProjectsAvailable, pinnedResources } = props;

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
    const validTags = _.reject(tags, (tag) => requirementFromString(tag) === undefined);
    setLabelFilter(validTags);
    setTypeaheadNameFilter(name || '');
  }, []);

  const updateSelectedItems = (selection: string) => {
    const updateItems = selectedItems;
    updateItems.has(selection) ? updateItems.delete(selection) : updateItems.add(selection);
    setSelectedItems(updateItems);
    setQueryArgument('kind', [...updateItems].join(','));
  };

  const updateNewItems = (filter: string, { key }: ToolbarChip) => {
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

  const pinToggle = (e: React.MouseEvent<HTMLElement>, resource: string) => {
    e.preventDefault();
    e.stopPropagation();

    const index = props.pinnedResources.indexOf(resource);
    if (index >= 0) {
      confirmNavUnpinModal(resource, pinnedResources, props.onPinnedResourcesChange);
      return;
    }
    props.onPinnedResourcesChange([...pinnedResources, resource]);
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
    type === searchFilterValues.Label
      ? updateLabelFilter(value, endOfString)
      : updateNameFilter(value);
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
        <title>Search</title>
      </Helmet>
      <PageHeading detail={true} title="Search">
        <Toolbar id="search-toolbar" clearAllFilters={clearAll}>
          <ToolbarContent>
            <ToolbarItem>
              <ToolbarFilter
                deleteChipGroup={clearSelectedItems}
                chips={[...selectedItems].map((resourceKind) => ({
                  key: resourceKind,
                  node: (
                    <>
                      <ResourceIcon kind={resourceKind} />
                      {kindForReference(resourceKind)}
                    </>
                  ),
                }))}
                deleteChip={updateNewItems}
                categoryName="Resource"
              >
                <ResourceListDropdown
                  selected={[...selectedItems]}
                  onChange={updateSelectedItems}
                />
              </ToolbarFilter>
            </ToolbarItem>
            <ToolbarItem className="co-search-group__filter">
              <ToolbarFilter
                deleteChipGroup={clearLabelFilter}
                chips={[...labelFilter]}
                deleteChip={removeLabelFilter}
                categoryName="Label"
              >
                <ToolbarFilter
                  chips={typeaheadNameFilter.length > 0 ? [typeaheadNameFilter] : []}
                  deleteChip={clearNameFilter}
                  categoryName="Name"
                >
                  <SearchFilterDropdown
                    onChange={updateSearchFilter}
                    nameFilterInput={typeaheadNameFilter}
                    labelFilterInput={labelFilterInput}
                  />
                </ToolbarFilter>
              </ToolbarFilter>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </PageHeading>
      <div className="co-search">
        <Accordion className="co-search__accordion" asDefinitionList={false}>
          {[...selectedItems].map((resource) => {
            const isCollapsed = collapsedKinds.has(resource);
            return (
              <AccordionItem key={resource}>
                <AccordionToggle
                  className="co-search-group__accordion-toggle"
                  onClick={() => toggleKindExpanded(resource)}
                  isExpanded={!isCollapsed}
                  id={`${resource}-toggle`}
                >
                  {getToggleText(resource)}
                  {props.perspective !== 'admin' && (
                    <Button
                      className="co-search-group__pin-toggle"
                      variant={ButtonVariant.link}
                      onClick={(e) => pinToggle(e, resource)}
                    >
                      {pinnedResources.includes(resource) ? (
                        <>
                          <MinusCircleIcon className="co-search-group__pin-toggle__icon" />
                          Remove from navigation
                        </>
                      ) : (
                        <>
                          <PlusCircleIcon className="co-search-group__pin-toggle__icon" />
                          Add to navigation
                        </>
                      )}
                    </Button>
                  )}
                </AccordionToggle>
                <AccordionContent isHidden={isCollapsed}>
                  {!isCollapsed && (
                    <ResourceList
                      kind={resource}
                      selector={selectorFromString(labelFilter.join(','))}
                      nameFilter={typeaheadNameFilter}
                      namespace={namespace}
                      mock={noProjectsAvailable}
                      key={resource}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        {selectedItems.size === 0 && (
          <MsgBox
            title="No resources selected"
            detail={<p>Select one or more resources from the dropdown.</p>}
          />
        )}
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
