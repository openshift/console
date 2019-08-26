import * as _ from 'lodash';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { Dropdown, LoadingInline } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';

type FirehoseList = {
  data?: K8sResourceKind[];
  [key: string]: any;
};

interface ResourceDropdownProps {
  id?: string;
  className?: string;
  dropDownClassName?: string;
  menuClassName?: string;
  buttonClassName?: string;
  title?: React.ReactNode;
  titlePrefix?: string;
  allApplicationsKey?: string;
  storageKey?: string;
  disabled?: boolean;
  allSelectorItem?: {
    allSelectorKey?: string;
    allSelectorTitle?: string;
  };
  actionItem?: {
    actionTitle: string;
    actionKey: string;
  };
  dataSelector: string[] | number[] | symbol[];
  loaded?: boolean;
  loadError?: string;
  placeholder?: string;
  resources?: FirehoseList[];
  selectedKey: string;
  autoSelect?: boolean;
  resourceFilter?: (resource: any) => boolean;
  onChange?: (key: string, name?: string) => void;
}

const ResourceDropdown: React.FC<ResourceDropdownProps> = (props) => {
  const {
    id,
    className,
    dropDownClassName,
    menuClassName,
    buttonClassName,
    titlePrefix,
    storageKey,
    disabled,
    resources,
    loaded,
    loadError,
    placeholder,
    allSelectorItem,
    resourceFilter,
    dataSelector,
    selectedKey,
    autoSelect,
    actionItem,
    onChange,
  } = props;
  const [items, setItems] = React.useState({});
  const [title, setTitle] = React.useState(
    loaded ? (
      <span className="btn-dropdown__item--placeholder">{placeholder}</span>
    ) : (
      <LoadingInline />
    ),
  );

  const handleChange = React.useCallback(
    (key: string) => {
      const name = items[key];
      const newTitle = actionItem && key === actionItem.actionKey ? actionItem.actionTitle : name;
      if (newTitle !== title) {
        onChange && onChange(key, name);
        setTitle(newTitle);
      }
    },
    [actionItem, items, onChange, title],
  );

  React.useEffect(() => {
    if (!loaded) {
      setTitle(<LoadingInline />);
      return;
    }

    // If autoSelect is true only then have an item pre-selected based on selectedKey.
    if (autoSelect) {
      const dropdownItem =
        loaded && _.isEmpty(items) && actionItem ? actionItem.actionKey : _.get(_.keys(items), 0);
      const selectedItemKey = selectedKey || dropdownItem;
      handleChange(selectedItemKey);
    } else if (!loaded || !selectedKey) {
      setTitle(<span className="btn-dropdown__item--placeholder">{placeholder}</span>);
    }

    if (loadError) {
      setTitle(<span className="cos-error-title">Error Loading - {placeholder}</span>);
    }

    const unsortedList = {};
    _.each(resources, ({ data }) => {
      _.reduce(
        data,
        (acc, resource) => {
          let dataValue;
          if (resourceFilter && resourceFilter(resource)) {
            dataValue = _.get(resource, dataSelector);
          } else if (!resourceFilter) {
            dataValue = _.get(resource, dataSelector);
          }
          if (dataValue) {
            acc[dataValue] = dataValue;
          }
          return acc;
        },
        unsortedList,
      );
    });

    const sortedList = {};

    if (allSelectorItem && !_.isEmpty(unsortedList)) {
      sortedList[allSelectorItem.allSelectorKey] = allSelectorItem.allSelectorTitle;
    }

    _.keys(unsortedList)
      .sort()
      .forEach((key) => {
        sortedList[key] = unsortedList[key];
      });

    setItems(sortedList);
    if (
      (_.isEmpty(sortedList) || !sortedList[selectedKey]) &&
      allSelectorItem &&
      allSelectorItem.allSelectorKey !== selectedKey
    ) {
      handleChange(allSelectorItem.allSelectorKey);
    }
  }, [
    actionItem,
    allSelectorItem,
    autoSelect,
    dataSelector,
    items,
    loadError,
    loaded,
    handleChange,
    placeholder,
    resourceFilter,
    resources,
    selectedKey,
  ]);

  return (
    <Dropdown
      id={id}
      className={className}
      dropDownClassName={dropDownClassName}
      menuClassName={menuClassName}
      buttonClassName={buttonClassName}
      titlePrefix={titlePrefix}
      autocompleteFilter={fuzzy}
      actionItem={actionItem}
      items={items}
      onChange={handleChange}
      selectedKey={selectedKey}
      title={props.title || title}
      autocompletePlaceholder={placeholder}
      storageKey={storageKey}
      disabled={disabled}
    />
  );
};

export default ResourceDropdown;
