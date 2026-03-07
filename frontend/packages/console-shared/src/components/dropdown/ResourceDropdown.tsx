import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { ConsoleSelectProps } from '@console/internal/components/utils/console-select';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import type { FirehoseResult } from '@console/internal/components/utils/types';
import type { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { referenceForModel, modelFor, referenceFor } from '@console/internal/module/k8s';

type DropdownItemProps = {
  model: K8sKind;
  name: string;
};

const DropdownItem: FC<DropdownItemProps> = ({ model, name }) => (
  <span className="co-resource-item">
    <span className="co-resource-icon--fixed-width">
      <ResourceIcon kind={referenceForModel(model)} />
    </span>
    <span className="co-resource-item__resource-name">
      <span>{name}</span>
    </span>
  </span>
);

export type ResourceDropdownItems = ConsoleSelectProps['items'];

export interface ResourceDropdownProps {
  actionItems?: ConsoleSelectProps['actionItems'];
  ariaLabel?: ConsoleSelectProps['ariaLabel'];
  autocompleteFilter?: ConsoleSelectProps['autocompleteFilter'];
  buttonClassName?: ConsoleSelectProps['buttonClassName'];
  className?: ConsoleSelectProps['className'];
  disabled?: ConsoleSelectProps['disabled'];
  id?: ConsoleSelectProps['id'];
  isFullWidth?: ConsoleSelectProps['isFullWidth'];
  menuClassName?: ConsoleSelectProps['menuClassName'];
  placeholder?: ConsoleSelectProps['autocompletePlaceholder'];
  selectedKey: ConsoleSelectProps['selectedKey'];
  storageKey?: ConsoleSelectProps['storageKey'];
  title?: ConsoleSelectProps['title'];
  titlePrefix?: ConsoleSelectProps['titlePrefix'];
  userSettingsPrefix?: ConsoleSelectProps['userSettingsPrefix'];

  allSelectorItem?: {
    allSelectorKey?: string;
    allSelectorTitle?: string;
  };
  noneSelectorItem?: {
    noneSelectorKey?: string;
    noneSelectorTitle?: string;
  };
  dataSelector: string[] | number[] | symbol[];
  transformLabel?: Function;
  loaded?: boolean;
  loadError?: string;
  resources?: FirehoseResult[];
  autoSelect?: boolean;
  resourceFilter?: (resource: K8sResourceKind) => boolean;
  onChange?: (
    key: string,
    name?: ResourceDropdownItems[keyof ResourceDropdownItems],
    selectedResource?: K8sResourceKind,
  ) => void;
  onLoad?: (items: ResourceDropdownItems) => void;
  showBadge?: boolean;
  customResourceKey?: (key: string, resource: K8sResourceKind) => string;
  appendItems?: ResourceDropdownItems;
}

const craftResourceKey = (
  resource: K8sResourceKind,
  dataSelector: ResourceDropdownProps['dataSelector'],
  resourceFilter: ResourceDropdownProps['resourceFilter'],
  customResourceKey: ResourceDropdownProps['customResourceKey'],
): { customKey: string; key: string } => {
  let key;
  if (resourceFilter && resourceFilter(resource)) {
    key = _.get(resource, dataSelector);
  } else if (!resourceFilter) {
    key = _.get(resource, dataSelector);
  }
  return {
    customKey: customResourceKey ? customResourceKey(key, resource) : key,
    key,
  };
};

export const ResourceDropdown: FC<ResourceDropdownProps> = ({
  actionItems,
  allSelectorItem,
  appendItems,
  ariaLabel,
  autocompleteFilter,
  autoSelect,
  buttonClassName,
  className,
  customResourceKey,
  dataSelector,
  disabled,
  id,
  isFullWidth,
  loaded,
  loadError,
  menuClassName,
  noneSelectorItem,
  onChange,
  onLoad,
  placeholder,
  resourceFilter,
  resources,
  selectedKey,
  showBadge = false,
  storageKey,
  title: titleProp,
  titlePrefix,
  transformLabel,
  userSettingsPrefix,
}) => {
  const { t } = useTranslation();
  const [selectedTitle, setSelectedTitle] = useState<ReactNode>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track mount state and previous selectedKey to match class component behavior:
  // the class constructor never auto-selects, and componentWillReceiveProps
  // compares against the previous selectedKey (this.props) for onChange calls.
  const mountedRef = useRef(false);
  const prevSelectedKeyRef = useRef(selectedKey);

  // Compute resource map: key -> K8sResourceKind
  const resourceMap = useMemo(() => {
    if (!loaded) {
      return {};
    }
    const map: Record<string, K8sResourceKind> = {};
    _.each(resources, ({ data }) => {
      _.each(data, (resource: K8sResourceKind) => {
        const { customKey, key } = craftResourceKey(
          resource,
          dataSelector,
          resourceFilter,
          customResourceKey,
        );
        const indexKey = customKey || key;
        if (indexKey) {
          map[indexKey] = resource;
        }
      });
    });
    return map;
  }, [loaded, resources, dataSelector, resourceFilter, customResourceKey]);

  // Compute sorted dropdown items
  const items = useMemo<ResourceDropdownItems>(() => {
    if (!loaded || loadError) {
      return {};
    }
    const unsortedList: ResourceDropdownItems = { ...appendItems };
    _.each(resources, ({ data, kind }) => {
      _.reduce(
        data,
        (acc, resource: K8sResourceKind) => {
          const { customKey, key: name } = craftResourceKey(
            resource,
            dataSelector,
            resourceFilter,
            customResourceKey,
          );
          const dataValue = customKey || name;
          if (dataValue) {
            if (showBadge) {
              const model = modelFor(referenceFor(resource)) || (kind && modelFor(kind));
              acc[dataValue] = model ? (
                <DropdownItem key={resource.metadata.uid} model={model} name={name} />
              ) : (
                name
              );
            } else {
              acc[dataValue] = transformLabel ? transformLabel(resource) : name;
            }
          }
          return acc;
        },
        unsortedList,
      );
    });

    const sortedList: ResourceDropdownItems = {};
    if (allSelectorItem && !_.isEmpty(unsortedList)) {
      sortedList[allSelectorItem.allSelectorKey] = allSelectorItem.allSelectorTitle;
    }
    if (noneSelectorItem && !_.isEmpty(unsortedList)) {
      sortedList[noneSelectorItem.noneSelectorKey] = noneSelectorItem.noneSelectorTitle;
    }
    _.keys(unsortedList)
      .sort()
      .forEach((key) => {
        sortedList[key] = unsortedList[key];
      });

    return sortedList;
  }, [
    loaded,
    loadError,
    resources,
    dataSelector,
    resourceFilter,
    customResourceKey,
    appendItems,
    showBadge,
    transformLabel,
    allSelectorItem,
    noneSelectorItem,
  ]);

  // Auto-selection and title sync when items or selection changes.
  // Skip the initial mount to match class component behavior (constructor never auto-selects).
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevSelectedKeyRef.current = selectedKey;
      return;
    }

    if (!loaded || loadError) {
      prevSelectedKeyRef.current = selectedKey;
      return;
    }

    let selectedItem = selectedKey;
    if (
      (_.isEmpty(items) || !items[selectedKey]) &&
      allSelectorItem &&
      allSelectorItem.allSelectorKey !== selectedKey
    ) {
      selectedItem = allSelectorItem.allSelectorKey;
    } else if (autoSelect && !selectedKey) {
      selectedItem =
        loaded && _.isEmpty(items) && actionItems
          ? actionItems[0].actionKey
          : _.get(_.keys(items), 0);
    }

    if (selectedItem) {
      const name = items[selectedItem];
      const selectedActionItem =
        actionItems && actionItems.find((ai) => selectedItem === ai.actionKey);
      const title = selectedActionItem ? selectedActionItem.actionTitle : name;
      setSelectedTitle(title);
      if (selectedItem !== prevSelectedKeyRef.current) {
        onChangeRef.current?.(selectedItem, name, resourceMap[selectedItem]);
      }
    }

    prevSelectedKeyRef.current = selectedKey;
  }, [
    loaded,
    loadError,
    items,
    selectedKey,
    autoSelect,
    allSelectorItem,
    actionItems,
    resourceMap,
  ]);

  // Notify parent when items are loaded
  useEffect(() => {
    if (loaded && onLoad) {
      onLoad(items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, items]);

  // Compute display title
  const displayTitle = useMemo<ReactNode>(() => {
    if (!loaded && !loadError) {
      return <LoadingInline />;
    }
    if (loadError) {
      return (
        <span className="cos-error-title">
          {t('console-shared~Error loading - {{placeholder}}', { placeholder })}
        </span>
      );
    }
    if (titleProp) {
      return titleProp;
    }
    if (selectedTitle) {
      return selectedTitle;
    }
    return <span className="btn-dropdown__item--placeholder">{placeholder}</span>;
  }, [loaded, loadError, titleProp, selectedTitle, placeholder, t]);

  const handleChange = useCallback<ConsoleSelectProps['onChange']>(
    (key) => {
      const name = items[key];
      const selectedActionItem = actionItems && actionItems.find((ai) => key === ai.actionKey);
      const title = selectedActionItem ? selectedActionItem.actionTitle : name;
      setSelectedTitle(title);
      if (key !== selectedKey) {
        onChangeRef.current?.(key, name, resourceMap[key]);
      }
    },
    [items, actionItems, selectedKey, resourceMap],
  );

  return (
    <ConsoleSelect
      id={id}
      ariaLabel={ariaLabel}
      className={className}
      menuClassName={menuClassName}
      buttonClassName={buttonClassName}
      titlePrefix={titlePrefix}
      isFullWidth={isFullWidth}
      autocompleteFilter={autocompleteFilter || fuzzy}
      actionItems={actionItems}
      items={items}
      onChange={handleChange}
      selectedKey={selectedKey}
      title={displayTitle}
      autocompletePlaceholder={placeholder}
      userSettingsPrefix={userSettingsPrefix}
      storageKey={storageKey}
      disabled={disabled}
    />
  );
};
