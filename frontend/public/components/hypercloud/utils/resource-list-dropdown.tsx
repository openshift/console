import * as React from 'react';
import * as _ from 'lodash-es';
import { OrderedMap } from 'immutable';
import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import { useFormContext } from 'react-hook-form';

import { Dropdown, ResourceIcon } from '../../utils';
import {
  K8sResourceKind,
  K8sResourceKindReference,
} from '../../../module/k8s';
import { Badge, Checkbox, DataToolbar, DataToolbarContent, DataToolbarFilter, DataToolbarItem, DataToolbarChip } from '@patternfly/react-core';

export type HCK8sResourceKind = K8sResourceKind & {
  fakeMetadata?: any;
};

const DropdownItem: React.SFC<DropdownItemProps> = ({ resource, checked }) => (
  <>
    <span className={'co-resource-item'}>
      <Checkbox
        tabIndex={-1}
        id={`${resource.metadata.uid}:checkbox`}
        checked={checked}
      />
      <span className="co-resource-icon--fixed-width">
        <ResourceIcon kind={resource.kind} />
      </span>
      <span className="co-resource-item__resource-name">
        <span>
          {resource.fakeMetadata?.fakename ?? resource.metadata.name}
        </span>
      </span>
    </span>
  </>
);

type DropdownItemProps = {
  resource: HCK8sResourceKind;
  checked?: boolean;
};

export const ResourceListDropdown: React.SFC<ResourceListDropdownProps> = (props) => {
  const { register, unregister, setValue } = useFormContext();
  const { name, required, resourceList, onChange, showAll, className, type } = props;

  const selected = name ? props.selected : props.selected;

  if (name) {
    React.useEffect(() => {
      setValue(name, selected);
      
    }, [selected]);

    React.useEffect(() => {
      register({ name }, { required });
  
      return () => {
        unregister(name);
      }
    }, [name, register, unregister]);
  }

  const isSelected = (uid: string) => {
    return _.includes(selected, 'All') || _.includes(selected, uid);
  };
  // Create dropdown items for each resource.
  const items = OrderedMap(
    _.map(resourceList, (resource) => [
      resource.metadata.uid,
      <DropdownItem
        resource={resource}
        checked={isSelected(resource.metadata.uid)} />
    ]
    ));
  // Add an "All" item to the top if `showAll`.
  const allItems = (showAll
    ? OrderedMap({
      All: (
        <>
          <span className="co-resource-item">
            <Checkbox id="all-resources" checked={isSelected('All')} />
            <span className="co-resource-icon--fixed-width">
              <ResourceIcon kind="All" />
            </span>
            <span className="co-resource-item__resource-name">All Resources</span>
          </span>
        </>
      ),
    }).concat(items)
    : items
  ).toJS() as { [s: string]: JSX.Element };

  const autocompleteFilter = (text, item) => {
    const { resource } = item.props;
    if (!resource) {
      return false;
    }

    return fuzzy(_.toLower(text), _.toLower(resource.fakeMetadata?.fakename ?? resource.metadata.name));
  };

  const autocompletePlaceholder = props.autocompletePlaceholder ?? "Select Resource";

  return (
    <Dropdown
      menuClassName="dropdown-menu--text-wrap"
      className={classNames('co-type-selector', className)}
      items={allItems}
      title={
        props.title ??
        <div key="title-resource">
          {props.resourceType ? `${props.resourceType} ` : 'Resources '}
          <Badge isRead>
            {selected.length === 1 && selected[0] === 'All' ? 'All' : selected.length}
          </Badge>
        </div>
      }
      onChange={onChange}
      autocompleteFilter={autocompleteFilter}
      autocompletePlaceholder={props.autocompleteFilter ?? autocompletePlaceholder}
      type={type}
    />
  );
};

export type ResourceListDropdownProps = {
  name?: string;
  required?: boolean;
  resourceList: HCK8sResourceKind[];
  selected: K8sResourceKindReference[];
  onChange: (value: string) => void;
  className?: string;
  showAll?: boolean;
  type?: string;
  title?: string | JSX.Element;
  resourceType?: string;
  autocompletePlaceholder?: string;
  autocompleteFilter?: (text: any, item: any) => any;
};

const ResourceListDropdownWithDataToolbar_: React.SFC<ResourceListDropdownWithDataToolbarProps> = (props, ref) => {
  const { resourceList } = props;
  const [selectedItems, setSelectedItems] = React.useState(new Set<string>([]));

  const allItems = new Set<string>(resourceList.map(resource => resource.metadata.uid));

  React.useEffect(()=>{
    props.onSelectedItemChange?.(selectedItems);
  }, [selectedItems]);

  const updateSelectedItems = (selection: string) => {
    if (selection === 'All') {
      selectedItems.has(selection) ? clearSelectedItems() : selectAllItems();
    } else {
      if (selectedItems.has('All')) {
        const updateItems = new Set(allItems);
        updateItems.delete(selection);
        setSelectedItems(updateItems);
      } else {
        const updateItems = new Set(selectedItems);
        updateItems.has(selection) ? updateItems.delete(selection) : updateItems.add(selection);
        updateItems.size === resourceList.length ? selectAllItems() : setSelectedItems(updateItems);
      }
    }
  };

  const updateNewItems = (filter: string, { key }: DataToolbarChip) => {
    updateSelectedItems(key);
  };

  const selectAllItems = () => {
    setSelectedItems(new Set(['All']));
  }

  const clearSelectedItems = () => {
    setSelectedItems(new Set([]));
  };

  const clearAll = () => {
    clearSelectedItems();
  };

  return (
    <DataToolbar id="search-toolbar" clearAllFilters={clearAll}>
      <DataToolbarContent>
        <DataToolbarItem>
          <DataToolbarFilter
            deleteChipGroup={clearSelectedItems}
            chips={[...selectedItems].map(uid => {
              const item = resourceList.find(i => i.metadata.uid === uid);
              return {
                key: uid,
                node: (
                  <>
                    <ResourceIcon kind={item?.kind ?? uid} />
                    {item?.fakeMetadata?.fakename ?? item?.metadata.name ?? uid}
                  </>
                ),
              }
            })}
            deleteChip={updateNewItems}
            categoryName={props.resourceType ?? "Resources"}
          >
            <ResourceListDropdown
              resourceList={resourceList}
              selected={[...selectedItems]}
              onChange={updateSelectedItems}
              type="multiple"
              {...props}
            />
          </DataToolbarFilter>
        </DataToolbarItem>
      </DataToolbarContent>
    </DataToolbar>)
};

export const ResourceListDropdownWithDataToolbar = React.forwardRef(ResourceListDropdownWithDataToolbar_);

export type ResourceListDropdownWithDataToolbarProps = {
  name?: string;
  required?: boolean;
  resourceList: HCK8sResourceKind[];
  className?: string;
  showAll?: boolean;
  title?: string | JSX.Element;
  resourceType?: string;
  autocompletePlaceholder?: string;
  autocompleteFilter?: (text: any, item: any) => any;
  onSelectedItemChange?: (items: Set<string>) => any;
};
