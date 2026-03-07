import * as _ from 'lodash';
import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { css } from '@patternfly/react-styles';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { LoadingInline } from './status-box';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceName, ResourceIcon } from './resource-icon';
import { isDefaultClass } from '../storage-class';
import { StorageClassResourceKind } from '@console/internal/module/k8s';

export type StorageClassDropdownProps = {
  id?: string;
  name?: string;
  onChange: (object) => void;
  describedBy?: string;
  desc?: string;
  defaultClass?: string;
  required?: boolean;
  hideClassName?: string;
  filter?: (param) => boolean;
  selectedKey?: string;
  'data-test'?: string;
};

const getTitle = (storageClass: { kindLabel: string; name: string }): ReactNode => {
  return storageClass.kindLabel ? (
    <ResourceName kind="StorageClass" name={storageClass.name} />
  ) : (
    <span>{storageClass.name}</span>
  );
};

const StorageClassDropdownEntry = (props) => {
  const storageClassProperties = [
    props.default ? ' (default)' : '',
    props.description,
    props.accessMode,
    props.provisioner,
    props.type,
    props.zone,
  ];
  const storageClassDescriptionLine = _.compact(storageClassProperties).join(' | ');
  return (
    <span className="co-resource-item">
      <ResourceIcon kind={props.kindLabel} />
      <span className="co-resource-item__resource-name">
        {props.name}
        <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">
          {' '}
          {storageClassDescriptionLine}
        </div>
      </span>
    </span>
  );
};

const StorageClassDropdownNoStorageClassOption: FC<{ name: string }> = ({ name }) => {
  return (
    <span className="co-resource-item">
      <span className="co-resource-item__resource-name">{name}</span>
    </span>
  );
};

/* Creates a dropdown list of storage classes */
export const StorageClassDropdown: FC<StorageClassDropdownProps> = ({
  id,
  onChange: onChangeProp,
  describedBy,
  desc,
  required,
  hideClassName,
  filter,
  selectedKey: selectedKeyProp,
  'data-test': dataTest,
}) => {
  const { t } = useTranslation('public');
  const [data, loaded, loadError] = useK8sWatchResource({
    kind: 'StorageClass',
    isList: true,
  });

  const [selectedKey, setSelectedKey] = useState<string | undefined>(selectedKeyProp);
  const onChangeRef = useRef(onChangeProp);
  onChangeRef.current = onChangeProp;

  // Process resources into sorted items and find default storage class
  const { items, defaultClass } = useMemo(() => {
    if (!loaded || loadError) {
      return { items: {} as Record<string, any>, defaultClass: '' };
    }

    const noStorageClass = t('No default StorageClass');
    let unorderedItems: Record<string, any> = {};

    _.map(data, (resource: StorageClassResourceKind) => {
      unorderedItems[resource.metadata.name] = {
        kindLabel: 'StorageClass',
        name: resource.metadata.name,
        description: _.get(resource, 'metadata.annotations.description', ''),
        default: isDefaultClass(resource),
        accessMode: _.get(
          resource,
          ['metadata', 'annotations', 'storage.alpha.openshift.io/access-mode'],
          '',
        ),
        provisioner: resource.provisioner,
        parameters: resource.parameters,
        type: _.get(resource, 'parameters.type', ''),
        zone: _.get(resource, 'parameters.zone', ''),
        resource,
      };
    });

    if (filter) {
      unorderedItems = Object.keys(unorderedItems)
        .filter((sc) => filter(unorderedItems[sc]))
        .reduce((acc, key) => {
          acc[key] = unorderedItems[key];
          return acc;
        }, {} as Record<string, any>);
    }

    const foundDefault = _.findKey(unorderedItems, 'default') || '';
    if (!foundDefault) {
      unorderedItems[''] = { kindLabel: '', name: noStorageClass };
    }

    const sortedItems: Record<string, any> = {};
    Object.keys(unorderedItems)
      .sort()
      .forEach((key) => {
        sortedItems[key] = unorderedItems[key];
      });

    return { items: sortedItems, defaultClass: foundDefault };
  }, [loaded, loadError, data, filter, t]);

  const effectiveKey = selectedKey ?? defaultClass;

  // Notify parent when selection or items change
  useEffect(() => {
    if (!loaded || loadError) {
      return;
    }
    const selectedItem = items[effectiveKey];
    if (selectedItem) {
      onChangeRef.current(selectedItem.resource);
    }
  }, [loaded, loadError, effectiveKey, items]);

  // Compute display title
  const displayTitle = useMemo<ReactNode>(() => {
    if (loadError) {
      return <div className="cos-error-title">{t('Error loading {{desc}}', { desc })}</div>;
    }
    if (!loaded) {
      return <LoadingInline />;
    }
    const selectedItem = items[effectiveKey];
    if (selectedItem) {
      return getTitle(selectedItem);
    }
    return <span className="pf-v6-u-text-color-subtle">{t('Select StorageClass')}</span>;
  }, [loadError, loaded, items, effectiveKey, desc, t]);

  // Build dropdown item elements
  const dropdownItems = useMemo(() => {
    const result: Record<string, ReactNode> = {};
    _.each(items, (props, key) => {
      result[key] = key ? (
        <StorageClassDropdownEntry {...props} />
      ) : (
        <StorageClassDropdownNoStorageClassOption {...props} />
      );
    });
    return result;
  }, [items]);

  const handleChange = useCallback((key: string) => {
    setSelectedKey(key);
  }, []);

  const autocompleteFilter = useCallback((text, item) => fuzzy(text, item.props.name), []);

  const itemsAvailableToShow = defaultClass || _.size(dropdownItems) > 1;

  return (
    <>
      {loaded && itemsAvailableToShow ? (
        <div>
          <label className={css(hideClassName, { 'co-required': required })} htmlFor={id}>
            {t('StorageClass')}
          </label>
          <ConsoleSelect
            className="co-storage-class-dropdown"
            isFullWidth
            autocompleteFilter={autocompleteFilter}
            autocompletePlaceholder={t('Select StorageClass')}
            items={dropdownItems}
            selectedKey={effectiveKey}
            title={displayTitle}
            alwaysShowTitle
            onChange={handleChange}
            id={id}
            dataTest={dataTest}
            menuClassName="dropdown-menu--text-wrap"
          />
          {describedBy ? (
            <p className="help-block" id={describedBy}>
              {t('StorageClass for the new claim')}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
};
