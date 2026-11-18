import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Alert } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { VolumeAttributesClassModel } from '../../models';
import type { VolumeAttributesClassKind } from '../../module/k8s';
import { ResourceName, ResourceIcon } from './resource-icon';

const getTitle = (vac: VolumeAttributesClassDropdownItem): React.ReactNode =>
  vac.kindLabel ? <ResourceName kind={vac.kindLabel} name={vac.name} /> : <span>{vac.name}</span>;

const VolumeAttributesClassDropdownEntry: FC<{
  kindLabel: string;
  name: string;
  driverName?: string;
  description?: string;
}> = ({ kindLabel, name, driverName, description }) => {
  const vacProperties = [driverName, description];
  const vacDescriptionLine = vacProperties.filter(Boolean).join(' | ');
  return (
    <span className="co-resource-item">
      <ResourceIcon kind={kindLabel} />
      <span className="co-resource-item__resource-name">
        {name}
        {vacDescriptionLine && (
          <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">
            {' '}
            {vacDescriptionLine}
          </div>
        )}
      </span>
    </span>
  );
};

const VolumeAttributesClassDropdownInner: FC<VolumeAttributesClassDropdownInnerProps> = ({
  id,
  loaded,
  loadError,
  resources,
  selectedKey: propsSelectedKey,
  dataTest,
  describedBy,
  required,
  hideClassName,
  onChange: onChangeCallback,
  filter,
}) => {
  const { t } = useTranslation('public');
  const placeholderTitle = useMemo(
    () => <span className="pf-v6-u-text-color-subtle">{t('Select VolumeAttributesClass')}</span>,
    [t],
  );

  // The dropdown is controlled by propsSelectedKey: reset the local selection
  // when it diverges. Consumers update their selectedKey prop from the
  // onChange callback.
  const [selectedKey, setSelectedKey] = useState(propsSelectedKey);
  if (selectedKey !== propsSelectedKey) {
    setSelectedKey(propsSelectedKey);
  }

  const items = useMemo<{ [key: string]: VolumeAttributesClassDropdownItem }>(() => {
    if (!loaded || loadError) {
      return {};
    }

    let unorderedItems: Record<string, VolumeAttributesClassDropdownItem> = {};
    const vacData = resources?.VolumeAttributesClass?.data || [];

    vacData.forEach((resource) => {
      unorderedItems[resource.metadata.name] = {
        kindLabel: 'VolumeAttributesClass',
        name: resource.metadata.name,
        description: resource.metadata?.annotations?.description,
        driverName: resource.driverName,
        parameters: resource.parameters,
        resource,
      };
    });

    if (filter) {
      unorderedItems = Object.keys(unorderedItems)
        .filter((vac) => filter(unorderedItems[vac]))
        .reduce((acc, key) => {
          acc[key] = unorderedItems[key];
          return acc;
        }, {});
    }

    const sortedItems: Record<string, VolumeAttributesClassDropdownItem> = {};
    Object.keys(unorderedItems)
      .sort()
      .forEach((key) => {
        sortedItems[key] = unorderedItems[key];
      });
    return sortedItems;
  }, [loaded, loadError, resources, filter]);

  const title = items[selectedKey] ? getTitle(items[selectedKey]) : placeholderTitle;

  const onChange = (key: string) => {
    const vac = items[key];
    if (vac) {
      setSelectedKey(key);
      if (onChangeCallback) {
        onChangeCallback(key, vac);
      }
    }
  };

  const autocompleteFilter = (text: string, item: React.ReactElement<{ name: string }>) =>
    fuzzy(text, item.props.name);
  const dropdownItems: Record<string, React.ReactNode> = {};
  Object.entries(items).forEach(([key, itemProps]) => {
    dropdownItems[key] = <VolumeAttributesClassDropdownEntry {...itemProps} />;
  });

  return (
    <>
      {loadError ? (
        <Alert isInline variant="danger" title={t('Error loading VolumeAttributesClass')}>
          {loadError.message || t('Unable to load VolumeAttributesClass resources')}
        </Alert>
      ) : loaded ? (
        <div>
          <label
            className={css(hideClassName, {
              'co-required': required,
            })}
            htmlFor={id}
            aria-label={hideClassName ? t('VolumeAttributesClass') : undefined}
          >
            {t('VolumeAttributesClass')}
          </label>
          <ConsoleSelect
            className="co-volume-attributes-class-dropdown"
            isFullWidth
            autocompleteFilter={autocompleteFilter}
            autocompletePlaceholder={t('Select VolumeAttributesClass')}
            items={dropdownItems}
            selectedKey={selectedKey || ''}
            title={title}
            alwaysShowTitle
            onChange={onChange}
            id={id}
            dataTest={dataTest}
            menuClassName="dropdown-menu--text-wrap"
          />
          {describedBy && (
            <p className="help-block" id={describedBy}>
              {t('Defines mutable volume parameters like IOPS and throughput.')}
            </p>
          )}
        </div>
      ) : null}
    </>
  );
};

export const VolumeAttributesClassDropdown: FC<VolumeAttributesClassDropdownProps> = (props) => {
  const isVACSupported = useFlag(FLAGS.VAC_PLATFORM_SUPPORT);

  const [data, loaded, loadError] = useK8sWatchResource<VolumeAttributesClassKind[]>({
    kind: VolumeAttributesClassModel.kind,
    isList: true,
    optional: true,
  });

  // If VAC is not supported on this platform, don't show the dropdown
  // Also hides during loading to prevent UI flash
  if (!isVACSupported) {
    return null;
  }

  const resources = {
    VolumeAttributesClass: {
      data,
      loaded,
      loadError,
    },
  };

  return (
    <VolumeAttributesClassDropdownInner
      {...props}
      loaded={loaded}
      loadError={loadError}
      resources={resources}
    />
  );
};

type VolumeAttributesClassDropdownInnerProps = {
  id?: string;
  loaded?: boolean;
  loadError?: Error;
  resources?: {
    VolumeAttributesClass?: {
      data: VolumeAttributesClassKind[];
      loaded?: boolean;
      loadError?: Error;
    };
  };
  name?: string;
  desc?: string;
  selectedKey: string;
  dataTest?: string;
  describedBy?: string;
  required?: boolean;
  hideClassName?: string;
  onChange?: (name: string, item?: VolumeAttributesClassDropdownItem) => void;
  filter?: (vac: VolumeAttributesClassDropdownItem) => boolean;
  placeholder?: string;
  noSelection?: boolean;
};

type VolumeAttributesClassDropdownItem = {
  kindLabel: string;
  name: string;
  description?: string;
  driverName?: string;
  parameters?: { [key: string]: string };
  resource?: VolumeAttributesClassKind;
};

export type VolumeAttributesClassDropdownProps = Omit<
  VolumeAttributesClassDropdownInnerProps,
  'loaded' | 'loadError' | 'resources'
>;
