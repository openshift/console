import * as fuzzy from 'fuzzysearch';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { LoadingInline, ResourceName, ResourceIcon } from '.';
import { css } from '@patternfly/react-styles';
import { VolumeAttributesClassModel } from '../../models';
import { VolumeAttributesClassKind } from '../../module/k8s';
import { useFlag } from '@console/shared/src/hooks/flag';
import { FLAGS } from '@console/shared/src/constants/common';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

const getTitle = (vac: VolumeAttributesClassDropdownItem): React.ReactNode => {
  return vac.kindLabel ? (
    <ResourceName kind={vac.kindLabel} name={vac.name} />
  ) : (
    <span>{vac.name}</span>
  );
};

const VolumeAttributesClassDropdownEntry: React.FCC<{
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

export const VolumeAttributesClassDropdownInner: React.FCC<VolumeAttributesClassDropdownInnerProps> = ({
  id,
  loaded,
  loadError,
  resources,
  name,
  desc,
  selectedKey: propsSelectedKey,
  dataTest,
  describedBy,
  required,
  hideClassName,
  onChange: onChangeCallback,
  filter,
  noSelection = false,
}) => {
  const { t } = useTranslation();
  const placeholderTitle = useMemo(
    () => (
      <span className="pf-v6-u-text-color-subtle">{t('public~Select VolumeAttributesClass')}</span>
    ),
    [t],
  );
  const [state, setState] = useState<VolumeAttributesClassDropdownInnerState>({
    items: {},
    name,
    selectedKey: propsSelectedKey,
    title: <LoadingInline />,
  });

  useEffect(() => {
    if (loadError) {
      setState((prevState) => ({
        ...prevState,
        title: (
          <div className="cos-error-title">{t('public~Error loading {{desc}}', { desc })}</div>
        ),
      }));
      return;
    }
    if (!loaded) {
      return;
    }

    const newState: Partial<VolumeAttributesClassDropdownInnerState> = {
      items: {},
      title: undefined,
    };
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

    const { selectedKey } = state;
    if (!loaded || !selectedKey || !unorderedItems[selectedKey]) {
      newState.title = placeholderTitle;
    }

    const selectedItem = unorderedItems[selectedKey];
    if (selectedItem) {
      newState.title = getTitle(selectedItem);
    }

    const sortedItems: Record<string, VolumeAttributesClassDropdownItem> = {};
    Object.keys(unorderedItems)
      .sort()
      .forEach((key) => {
        sortedItems[key] = unorderedItems[key];
      });
    newState.items = sortedItems;

    setState((prevState) => ({ ...prevState, ...newState }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, loadError, resources, filter, t, desc, noSelection]);

  useEffect(() => {
    if (propsSelectedKey !== state.selectedKey) {
      const { items } = state;
      const title = items[propsSelectedKey] ? getTitle(items[propsSelectedKey]) : placeholderTitle;
      setState((prevState) => ({ ...prevState, selectedKey: propsSelectedKey, title }));
    }
  }, [propsSelectedKey, state, placeholderTitle]);

  const onChange = (key: string) => {
    const vac = state.items?.[key];
    if (vac) {
      setState((prevState) => ({
        ...prevState,
        selectedKey: key,
        title: getTitle(vac),
      }));
      if (onChangeCallback) {
        onChangeCallback(key, vac);
      }
    }
  };

  const autocompleteFilter = (text: string, item: React.ReactElement) =>
    fuzzy(text, item.props.name);
  const dropdownItems: Record<string, React.ReactNode> = {};
  Object.entries(state.items).forEach(([key, itemProps]) => {
    dropdownItems[key] = <VolumeAttributesClassDropdownEntry {...itemProps} />;
  });

  const { selectedKey } = state;

  return (
    <>
      {loaded && (
        <div>
          <label
            className={css(hideClassName, {
              'co-required': required,
            })}
            htmlFor={id}
            aria-label={hideClassName ? t('public~VolumeAttributesClass') : undefined}
          >
            {t('public~VolumeAttributesClass')}
          </label>
          <ConsoleSelect
            className="co-volume-attributes-class-dropdown"
            isFullWidth
            autocompleteFilter={autocompleteFilter}
            autocompletePlaceholder={t('public~Select VolumeAttributesClass')}
            items={dropdownItems}
            selectedKey={selectedKey || ''}
            title={state.title}
            alwaysShowTitle
            onChange={onChange}
            id={id}
            dataTest={dataTest}
            menuClassName="dropdown-menu--text-wrap"
          />
          {describedBy && (
            <p className="help-block" id={describedBy}>
              {t('public~Defines mutable volume parameters like IOPS and throughput.')}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export const VolumeAttributesClassDropdown: React.FCC<VolumeAttributesClassDropdownProps> = (
  props,
) => {
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

export type VolumeAttributesClassDropdownInnerProps = {
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

export type VolumeAttributesClassDropdownInnerState = {
  items: { [key: string]: VolumeAttributesClassDropdownItem };
  name: string;
  selectedKey: string;
  title: React.ReactNode;
};

export type VolumeAttributesClassDropdownProps = Omit<
  VolumeAttributesClassDropdownInnerProps,
  'loaded' | 'loadError' | 'resources'
>;
