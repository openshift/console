import * as React from 'react';
import {
  DualListSelector,
  DualListSelectorTreeItemData,
  FormSection,
} from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useTelemetry } from '@console/shared/src';
import { CatalogCategory } from '@console/shared/src/components/catalog/utils/types';
import {
  useDebounceCallback,
  useConsoleOperatorConfig,
  patchConsoleOperatorConfig,
  LoadError,
  SaveStatus,
  SaveStatusProps,
} from '@console/shared/src/components/cluster-configuration';
import { defaultCatalogCategories } from '@console/shared/src/utils/default-categories';

type DeveloperCatalogTypesConsoleConfig = K8sResourceKind & {
  spec: {
    customization?: {
      developerCatalog?: {
        categories?: CatalogCategory[];
      };
    };
  };
};

const CatalogCategoriesConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  // Current configuration
  const [consoleConfig, consoleConfigLoaded, consoleConfigError] = useConsoleOperatorConfig<
    DeveloperCatalogTypesConsoleConfig
  >();
  const [currentCategories, setCurrentCategories] = React.useState<CatalogCategory[]>();
  React.useEffect(() => {
    if (consoleConfig && consoleConfigLoaded && !currentCategories) {
      setCurrentCategories(
        consoleConfig?.spec?.customization?.developerCatalog?.categories ||
          defaultCatalogCategories,
      );
    }
  }, [consoleConfig, consoleConfigLoaded, currentCategories]);

  // Calculate options
  const [enabledOptions, disabledOptions] = React.useMemo<
    [DualListSelectorTreeItemData[], DualListSelectorTreeItemData[]]
  >(() => {
    if (!consoleConfigLoaded) {
      return [[], []];
    }

    const catalogCategoryToTreeItemData = (
      catalogCategory: CatalogCategory,
    ): DualListSelectorTreeItemData => ({
      id: catalogCategory.id,
      text: catalogCategory.label,
      isChecked: false,
      children: catalogCategory.subcategories?.map(catalogCategoryToTreeItemData),
      defaultExpanded: true,
    });

    const x = defaultCatalogCategories.map(catalogCategoryToTreeItemData);

    return [x, []];
  }, [consoleConfigLoaded]);

  // Save the latest value (types)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatusProps>();
  const save = useDebounceCallback(() => {
    fireTelemetryEvent('Console cluster configuration changed', {
      customize: 'Developer Catalog categories',
    });
    setSaveStatus({ status: 'in-progress' });

    const patch: DeveloperCatalogTypesConsoleConfig = {
      spec: {
        customization: {
          developerCatalog: {
            categories: currentCategories,
            // types: types.length > 0 ? types : null
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
    newEnabledOptions: DualListSelectorTreeItemData[],
    newDisabledOptions: DualListSelectorTreeItemData[],
  ) => {
    // eslint-disable-next-line no-console
    console.log('xxx categories onListChange', newEnabledOptions, newDisabledOptions);
    setSaveStatus({ status: 'pending' });
    save();
  };

  const filterOption = (option: DualListSelectorTreeItemData, input: string): boolean => {
    return fuzzy(input.toLocaleLowerCase(), option.text.toLocaleLowerCase());
  };

  return (
    <FormSection
      title={t('devconsole~Developer catalog')}
      data-test="catalog-categories form-section"
    >
      <DualListSelector
        availableOptionsTitle={t('devconsole~Enabled categories')}
        chosenOptionsTitle={t('devconsole~Disabled categories')}
        isSearchable
        isTree
        availableOptions={enabledOptions}
        chosenOptions={disabledOptions}
        onListChange={onListChange}
        filterOption={filterOption}
        isDisabled={readonly || !consoleConfigLoaded || !!consoleConfigError}
      />

      <LoadError error={consoleConfigError} />
      <SaveStatus {...saveStatus} />
    </FormSection>
  );
};

export default CatalogCategoriesConfiguration;
