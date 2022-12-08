import * as React from 'react';
import { DualListSelector, FormHelperText, FormSection } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { CatalogItemType, isCatalogItemType } from '@console/dynamic-plugin-sdk/src/extensions';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/lib-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useTelemetry } from '@console/shared/src';
import {
  useDebounceCallback,
  useConsoleOperatorConfig,
  patchConsoleOperatorConfig,
  LoadError,
  SaveStatus,
  SaveStatusProps,
} from '@console/shared/src/components/cluster-configuration';

type Types = {
  state: 'Enabled' | 'Disabled';
  enabled?: string[];
  disabled?: string[];
};

type DeveloperCatalogTypesConsoleConfig = K8sResourceKind & {
  spec: {
    customization?: {
      developerCatalog?: {
        types?: Types;
      };
    };
  };
};

type ItemProps = { type: string; title: string };

const Item: React.FC<ItemProps> = ({ title }) => <>{title}</>;

const CatalogTypesConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  // Available catalog types
  const [catalogTypesExtensions, catalogTypesExtensionsLoaded] = useResolvedExtensions<
    CatalogItemType
  >(isCatalogItemType);
  const sortedCatalogTypeExtensions = React.useMemo(() => {
    return [...catalogTypesExtensions].sort((catalogTypeExtensionA, catalogTypeExtensionB) => {
      const titleA = catalogTypeExtensionA.properties.title;
      const titleB = catalogTypeExtensionB.properties.title;
      return titleA.localeCompare(titleB);
    });
  }, [catalogTypesExtensions]);
  const catalogTypesByType = React.useMemo<Record<string, CatalogItemType>>(
    () =>
      catalogTypesExtensions.reduce((acc, catalogItemType) => {
        acc[catalogItemType.properties.type] = catalogItemType;
        return acc;
      }, {}),
    [catalogTypesExtensions],
  );

  // Current configuration
  const [consoleConfig, consoleConfigLoaded, consoleConfigError] = useConsoleOperatorConfig<
    DeveloperCatalogTypesConsoleConfig
  >();
  const [types, setTypes] = React.useState<Types>();
  React.useEffect(() => {
    if (consoleConfig && consoleConfigLoaded && !types) {
      setTypes(consoleConfig?.spec?.customization?.developerCatalog?.types);
    }
  }, [consoleConfig, consoleConfigLoaded, types]);

  // Calculate options
  const [enabledOptions, disabledOptions] = React.useMemo<
    [React.ReactElement<ItemProps>[], React.ReactElement<ItemProps>[]]
  >(() => {
    if (!consoleConfigLoaded) {
      return [[], []];
    }
    if (!types?.state || types.state === 'Enabled') {
      if (types?.enabled?.length > 0) {
        return [
          [...types.enabled]
            .sort((typeA, typeB) => {
              const catalogTypeExtensionA = catalogTypesByType[typeA];
              const catalogTypeExtensionB = catalogTypesByType[typeB];
              const titleA = catalogTypeExtensionA?.properties.title || typeA;
              const titleB = catalogTypeExtensionB?.properties.title || typeB;
              return titleA.localeCompare(titleB);
            })
            .map((type) => (
              <Item
                key={type}
                type={type}
                title={catalogTypesByType[type]?.properties.title || type}
              />
            )),
          sortedCatalogTypeExtensions
            .filter((catalogItemType) => !types.enabled.includes(catalogItemType.properties.type))
            .map((catalogItemType) => (
              <Item
                key={catalogItemType.properties.type}
                type={catalogItemType.properties.type}
                title={catalogItemType.properties.title}
              />
            )),
        ];
      }
      return [
        sortedCatalogTypeExtensions.map((catalogItemType) => (
          <Item
            key={catalogItemType.properties.type}
            type={catalogItemType.properties.type}
            title={catalogItemType.properties.title}
          />
        )),
        [],
      ];
    }
    if (types?.state === 'Disabled') {
      if (types.disabled?.length > 0) {
        return [
          sortedCatalogTypeExtensions
            .filter((catalogItemType) => !types.disabled.includes(catalogItemType.properties.type))
            .map((catalogItemType) => (
              <Item
                key={catalogItemType.properties.type}
                type={catalogItemType.properties.type}
                title={catalogItemType.properties.title}
              />
            )),
          [...types.disabled]
            .sort((typeA, typeB) => {
              const catalogTypeExtensionA = catalogTypesByType[typeA];
              const catalogTypeExtensionB = catalogTypesByType[typeB];
              const titleA = catalogTypeExtensionA?.properties.title || typeA;
              const titleB = catalogTypeExtensionB?.properties.title || typeB;
              return titleA.localeCompare(titleB);
            })
            .map((type) => (
              <Item
                key={type}
                type={type}
                title={catalogTypesByType[type]?.properties.title || type}
              />
            )),
        ];
      }
      return [
        [],
        sortedCatalogTypeExtensions.map((catalogItemType) => (
          <Item
            key={catalogItemType.properties.type}
            type={catalogItemType.properties.type}
            title={catalogItemType.properties.title}
          />
        )),
      ];
    }
    return [[], []];
  }, [consoleConfigLoaded, types, sortedCatalogTypeExtensions, catalogTypesByType]);

  // Save the latest value (types)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatusProps>();
  const save = useDebounceCallback(() => {
    fireTelemetryEvent('Console cluster configuration changed', {
      customize: 'Developer Catalog types',
      state: types?.state,
      types:
        types?.state === 'Enabled'
          ? types.enabled || []
          : types?.state === 'Disabled'
          ? types.disabled || []
          : null,
    });
    setSaveStatus({ status: 'in-progress' });

    const patch: DeveloperCatalogTypesConsoleConfig = {
      spec: {
        customization: {
          developerCatalog: {
            types:
              // Force null (clear types) when state is enabled and no enabled option is defined.
              types && !(types.state === 'Enabled' && !types.enabled?.length)
                ? {
                    state: types.state,
                    // Force null (clear both lists) when they are undefined.
                    enabled: types.enabled || null,
                    disabled: types.disabled || null,
                  }
                : null,
          },
        },
      },
    };
    patchConsoleOperatorConfig(patch)
      .then(() => setSaveStatus({ status: 'successful' }))
      .catch((error) => setSaveStatus({ status: 'error', error }));
  }, 2000);

  // Extract types from Items
  const onListChange = (
    newEnabledOptions: React.ReactElement<ItemProps>[],
    newDisabledOptions: React.ReactElement<ItemProps>[],
  ) => {
    if (types?.state === 'Enabled') {
      if (newEnabledOptions.length === 0) {
        setTypes({ state: 'Disabled' });
      } else if (!types.enabled?.length) {
        // When there was NO enabled option before, we assume the admin want to disable
        // only the selected options:
        setTypes({
          state: 'Disabled',
          disabled: newDisabledOptions.map((node) => node.props.type),
        });
      } else {
        // Otherwise the state was enabled and contains a list of enabled options.
        // In this case we just drop the this option.
        setTypes({ state: 'Enabled', enabled: newEnabledOptions.map((node) => node.props.type) });
      }
    }
    if (!types?.state || types?.state === 'Disabled') {
      if (newDisabledOptions.length === 0) {
        setTypes({ state: 'Enabled' });
      } else {
        setTypes({
          state: 'Disabled',
          disabled: newDisabledOptions.map((node) => node.props.type),
        });
      }
    }
    setSaveStatus({ status: 'pending' });
    save();
  };

  const filterOption = (option: React.ReactElement<ItemProps>, input: string): boolean => {
    return fuzzy(input.toLocaleLowerCase(), option.props.title.toLocaleLowerCase());
  };

  return (
    <FormSection title={t('devconsole~Developer catalog')} data-test="catalog-types form-section">
      <FormHelperText isHidden={false}>
        {t(
          'devconsole~Another option to customize and standardize your development process. As an admin, you can disable the complete Developer Catalog, or individual sub-catalogs (available as Types in the Developer Catalog). Also here the "Search" and "Topology" will still show such resources.',
        )}
      </FormHelperText>
      <DualListSelector
        availableOptionsTitle={t('devconsole~Enabled types')}
        chosenOptionsTitle={t('devconsole~Disabled types')}
        isSearchable
        availableOptions={enabledOptions}
        chosenOptions={disabledOptions}
        onListChange={onListChange}
        filterOption={filterOption}
        isDisabled={
          readonly || !catalogTypesExtensionsLoaded || !consoleConfigLoaded || !!consoleConfigError
        }
      />

      <LoadError error={consoleConfigError} />
      <SaveStatus {...saveStatus} />
    </FormSection>
  );
};

export default CatalogTypesConfiguration;
