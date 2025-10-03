/* eslint-disable @typescript-eslint/no-use-before-define */
import * as _ from 'lodash-es';
import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { Firehose, LoadingInline, ResourceName, ResourceIcon } from '.';
import { css } from '@patternfly/react-styles';
import { VolumeAttributesClassModel } from '../../models';
import { VolumeAttributesClassKind } from '../../module/k8s';
import { useFlag } from '@console/shared/src/hooks/flag';

const VolumeAttributesClassDropdownEntry: React.FCC<{
  kindLabel: string;
  name: string;
  driverName?: string;
  description?: string;
}> = ({ kindLabel, name, driverName, description }) => {
  const vacProperties = [driverName, description];
  const vacDescriptionLine = _.compact(vacProperties).join(' | ');
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

const VolumeAttributesClassDropdownNoVACOption: React.FCC<{ name: string }> = ({ name }) => {
  return (
    <span className="co-resource-item">
      <span className="co-resource-item__resource-name">{name}</span>
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
}) => {
  const { t } = useTranslation();
  const [state, setState] = React.useState<VolumeAttributesClassDropdownInnerState>({
    items: {},
    name,
    selectedKey: propsSelectedKey,
    title: <LoadingInline />,
  });

  React.useEffect(() => {
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
      title: {},
    };
    let unorderedItems: Record<string, VolumeAttributesClassDropdownItem> = {};
    const noVolumeAttributesClass = t('public~No VolumeAttributesClass');

    const vacData = resources?.VolumeAttributesClass?.data || [];

    _.map(vacData, (resource) => {
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

    // Add No VAC option
    unorderedItems[''] = { kindLabel: '', name: noVolumeAttributesClass };

    const { selectedKey } = state;
    if (!loaded || !selectedKey || !unorderedItems[selectedKey]) {
      newState.title = (
        <span className="pf-v6-u-text-color-subtle">
          {t('public~Select VolumeAttributesClass')}
        </span>
      );
    }

    const selectedItem = unorderedItems[selectedKey];
    if (selectedItem) {
      newState.title = getTitle(selectedItem);
    }

    // Sort items by name (with empty option first)
    const sortedKeys = _.keys(unorderedItems).sort((a, b) => {
      if (a === '') {
        return -1;
      }
      if (b === '') {
        return 1;
      }
      return a.localeCompare(b);
    });

    const sortedItems: Record<string, VolumeAttributesClassDropdownItem> = {};
    _.each(sortedKeys, (key) => {
      sortedItems[key] = unorderedItems[key];
    });
    newState.items = sortedItems;

    setState((prevState) => ({ ...prevState, ...newState }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, loadError, resources, filter, t, desc]);

  React.useEffect(() => {
    if (propsSelectedKey !== state.selectedKey) {
      const { items } = state;
      const title = items[propsSelectedKey]
        ? getTitle(items[propsSelectedKey])
        : items['']?.name || '';
      setState((prevState) => ({ ...prevState, selectedKey: propsSelectedKey, title }));
    }
  }, [propsSelectedKey, state]);

  const onChange = (key: string) => {
    const vac = _.get(state, ['items', key], {});
    setState((prevState) => ({
      ...prevState,
      selectedKey: key,
      title: getTitle(vac),
    }));
    if (onChangeCallback) {
      onChangeCallback(key, vac);
    }
  };

  const autocompleteFilter = (text: string, item: React.ReactElement) =>
    fuzzy(text, item.props.name);
  const dropdownItems: Record<string, React.ReactNode> = {};
  _.each(
    state.items,
    (itemProps, key) =>
      (dropdownItems[key] = key ? (
        <VolumeAttributesClassDropdownEntry {...itemProps} />
      ) : (
        <VolumeAttributesClassDropdownNoVACOption {...itemProps} />
      )),
  );

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
            renderInline
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

const getTitle = (vac: VolumeAttributesClassDropdownItem): React.ReactNode => {
  return vac.kindLabel ? (
    <ResourceName kind={vac.kindLabel} name={vac.name} />
  ) : (
    <span>{vac.name}</span>
  );
};

export const VolumeAttributesClassDropdown: React.FCC<VolumeAttributesClassDropdownProps> = (
  props,
) => {
  const isVACSupported = useFlag('VAC_PLATFORM_SUPPORT');

  // If VAC is not supported on this platform, don't show the dropdown
  if (!isVACSupported) {
    return null;
  }

  const resources = [
    {
      kind: VolumeAttributesClassModel.kind,
      isList: true,
      prop: 'VolumeAttributesClass',
      optional: true,
    },
  ];
  return (
    <Firehose resources={resources}>
      <VolumeAttributesClassDropdownInner {...props} />
    </Firehose>
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
  onChange?: (name: string, item: VolumeAttributesClassDropdownItem) => void;
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
