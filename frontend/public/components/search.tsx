import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';

import { AsyncComponent } from './utils/async';
import { connectToModel } from '../kinds';
import { DefaultPage } from './default-resource';
import { requirementFromString } from '../module/k8s/selector-requirement';
import { ResourceListDropdown } from './resource-dropdown';
import { resourceListPages } from './resource-pages';
import { withStartGuide } from './start-guide';
import { split, selectorFromString } from '../module/k8s/selector';
import { referenceForModel, kindForReference } from '../module/k8s';
import { history, LoadingBox, PageHeading, SelectorInput } from './utils';
import { Expandable, SelectOptionObject } from '@patternfly/react-core';

const ResourceList = connectToModel(({ kindObj, mock, namespace, selector }) => {
  if (!kindObj) {
    return <LoadingBox />;
  }

  const componentLoader = resourceListPages.get(referenceForModel(kindObj), () =>
    Promise.resolve(DefaultPage),
  );
  const ns = kindObj.namespaced ? namespace : undefined;

  return (
    <AsyncComponent
      loader={componentLoader}
      namespace={ns}
      selector={selector}
      kind={kindObj.crd ? referenceForModel(kindObj) : kindObj.kind}
      showTitle={false}
      showTextFilter={false}
      autoFocus={false}
      mock={mock}
    />
  );
});

const updateUrlParams = (k, v) => {
  const url = new URL(String(window.location));
  const sp = new URLSearchParams(window.location.search);
  sp.set(k, v);
  history.push(`${url.pathname}?${sp.toString()}${url.hash}`);
};

const updateKind = (selectedItems) =>
  updateUrlParams('kind', selectedItems.map(encodeURIComponent).join(','));
const updateTags = (tags) => updateUrlParams('q', tags.map(encodeURIComponent).join(','));

const SearchPage_: React.FC<SearchProps> = (props) => {
  const [selectedItems, setSelectedItems] = React.useState(['']);
  const [collaspedState, setCollaspedState] = React.useState([]);
  const { location, namespace, noProjectsAvailable } = props;
  let kind: string, q: string;

  if (location.search) {
    const sp = new URLSearchParams(window.location.search);
    kind = sp.get('kind');
    q = sp.get('q');
  }

  React.useEffect(() => {
    setSelectedItems(kind.split(','));
  }, [kind]);

  // Ensure that the "kind" route parameter is a valid resource kind ID
  kind = kind ? decodeURIComponent(kind) : 'core~v1~Service';
  const tags = split(_.isString(q) ? decodeURIComponent(q) : '');
  const validTags = _.reject(tags, (tag) => requirementFromString(tag) === undefined);
  const selector = selectorFromString(validTags.join(','));
  const labelClassName = `co-text-${_.toLower(kindForReference(kind))}`;

  const updateSelectedItems = (
    event: React.MouseEvent<Element, MouseEvent> | React.ChangeEvent<Element>,
    selection: string | SelectOptionObject,
  ) => {
    const updateItems: string[] = selectedItems.includes(selection as string)
      ? selectedItems.filter((keepItem: string) => keepItem !== selection)
      : [...selectedItems, selection as string];
    setSelectedItems(updateItems);
    updateKind(updateItems);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const isKindExpanded = (kind: string) => {
    return collaspedState.includes(kind);
  };

  const toggleIfKindExpanded = (kind: string) => {
    const collaspedItems: string[] = collaspedState.includes(kind)
      ? collaspedState.filter((keepItem: string) => keepItem !== kind)
      : [...collaspedState, kind as string];
    setCollaspedState(collaspedItems);
  };

  return (
    <>
      <Helmet>
        <title>Search</title>
      </Helmet>
      <PageHeading detail={true} title="Search">
        <div className="co-search">
          <div className="pf-c-input-group">
            <ResourceListDropdown
              selected={selectedItems}
              onChange={updateSelectedItems}
              clearSelection={clearSelection}
            />
            <SelectorInput
              labelClassName={labelClassName}
              tags={validTags}
              onChange={updateTags}
              autoFocus={!noProjectsAvailable}
            />
          </div>
        </div>
      </PageHeading>
      <div className="co-search">
        {selectedItems.map((item) => {
          return (
            <Expandable
              key={item}
              toggleText={isKindExpanded(item) ? `Hide ${item}` : `Show ${item}`}
              onToggle={() => toggleIfKindExpanded(item)}
              isExpanded={isKindExpanded(item)}
            >
              <ResourceList
                kind={item}
                selector={selector}
                namespace={namespace}
                mock={noProjectsAvailable}
                key={item}
              />
            </Expandable>
          );
        })}
      </div>
    </>
  );
};

export const SearchPage = withStartGuide(SearchPage_);

export type SearchProps = {
  location: any;
  namespace: string;
  noProjectsAvailable: boolean;
};
