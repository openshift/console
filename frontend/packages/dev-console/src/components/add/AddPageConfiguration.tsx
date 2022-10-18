import * as React from 'react';
import { DualListSelector, FormSection } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import {
  AddAction,
  isAddAction,
  ResolvedExtension,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk/src';
import './AddCardItem.scss';
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

type DeveloperCatalogAddPageConfig = K8sResourceKind & {
  spec: {
    customization?: {
      addPage?: {
        disabledActions?: string[];
      };
    };
  };
};

type ItemProps = { id: string; addAction?: ResolvedExtension<AddAction> };

const Item: React.FC<ItemProps> = ({ id, addAction }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    {typeof addAction?.properties.icon === 'string' ? (
      <img
        className="odc-add-card-item__icon odc-add-card-item__img-icon"
        src={addAction.properties.icon}
        alt={addAction.properties.label}
        aria-hidden="true"
      />
    ) : typeof addAction?.properties.icon !== 'string' &&
      addAction?.properties.icon &&
      React.isValidElement(addAction.properties.icon) ? (
      <span className="odc-add-card-item__icon" aria-hidden="true">
        {addAction.properties.icon}
      </span>
    ) : null}
    <div>{addAction?.properties.label || id}</div>
  </div>
);

const AddPageConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  // Available add page items
  const [addActionExtensions, addActionExtensionsResolved] = useResolvedExtensions<AddAction>(
    isAddAction,
  );

  // Current configuration
  const [consoleConfig, consoleConfigLoaded, consoleConfigError] = useConsoleOperatorConfig<
    DeveloperCatalogAddPageConfig
  >();
  const [disabled, setDisabled] = React.useState<string[]>();
  React.useEffect(() => {
    if (consoleConfig && consoleConfigLoaded && !disabled) {
      setDisabled(consoleConfig?.spec?.customization?.addPage?.disabledActions || []);
    }
  }, [consoleConfig, consoleConfigLoaded, disabled]);

  // Calculate options
  const enabledOptions = React.useMemo<React.ReactElement<ItemProps>[]>(() => {
    if (!consoleConfigLoaded || !addActionExtensions || !addActionExtensionsResolved || !disabled) {
      return [];
    }
    return addActionExtensions
      .filter((addAction) => !disabled || !disabled.includes(addAction.properties.id))
      .sort((addActionA, addActionB) => {
        const displayNameA = addActionA.properties.label;
        const displayNameB = addActionB.properties.label;
        return displayNameA.localeCompare(displayNameB);
      })
      .map((addAction) => (
        <Item key={addAction.uid} id={addAction.properties.id} addAction={addAction} />
      ));
  }, [addActionExtensions, addActionExtensionsResolved, consoleConfigLoaded, disabled]);
  const disabledOptions = React.useMemo<React.ReactElement<ItemProps>[]>(() => {
    if (!disabled) {
      return [];
    }
    const addActionsById = addActionExtensions.reduce<Record<string, ResolvedExtension<AddAction>>>(
      (acc, addAction) => {
        acc[addAction.properties.id] = addAction;
        return acc;
      },
      {},
    );
    return [...disabled]
      .sort((idA, idB) => {
        const addActionA = addActionsById[idA];
        const addActionB = addActionsById[idB];
        const displayNameA = addActionA?.properties.label || idA;
        const displayNameB = addActionB?.properties.label || idB;
        return displayNameA.localeCompare(displayNameB);
      })
      .map((id) => <Item key={id} id={id} addAction={addActionsById[id]} />);
  }, [addActionExtensions, disabled]);

  // Save the latest value (disabled string array)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatusProps>();
  const save = useDebounceCallback(() => {
    fireTelemetryEvent('Console cluster configuration changed', {
      customize: 'Add page actions',
      disabledActions: disabled?.length > 0 ? disabled : null,
    });
    setSaveStatus({ status: 'in-progress' });

    const patch: DeveloperCatalogAddPageConfig = {
      spec: {
        customization: {
          addPage: {
            disabledActions: disabled?.length > 0 ? disabled : null,
          },
        },
      },
    };
    patchConsoleOperatorConfig(patch)
      .then(() => setSaveStatus({ status: 'successful' }))
      .catch((error) => setSaveStatus({ status: 'error', error }));
  }, 2000);

  // Extract disabled string array from Items
  const onListChange = (
    newEnabledOptions: React.ReactElement<ItemProps>[],
    newDisabledOptions: React.ReactElement<ItemProps>[],
  ) => {
    setDisabled(newDisabledOptions.map((node) => node.props.id));
    setSaveStatus({ status: 'pending' });
    save();
  };

  const filterOption = (option: React.ReactElement<ItemProps>, input: string): boolean => {
    const title = option.props.addAction?.properties.label || option.props.id;
    return fuzzy(input.toLocaleLowerCase(), title.toLocaleLowerCase());
  };

  return (
    <FormSection title={t('devconsole~Add page')} data-test="add-page form-section">
      <DualListSelector
        availableOptionsTitle={t('devconsole~Enabled actions')}
        chosenOptionsTitle={t('devconsole~Disabled actions')}
        isSearchable
        availableOptions={enabledOptions}
        chosenOptions={disabledOptions}
        onListChange={onListChange}
        filterOption={filterOption}
        isDisabled={
          readonly || !addActionExtensionsResolved || !consoleConfigLoaded || consoleConfigError
        }
      />

      <LoadError error={consoleConfigError} />
      <SaveStatus {...saveStatus} />
    </FormSection>
  );
};

export default AddPageConfiguration;
