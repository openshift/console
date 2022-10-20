import * as React from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import { DualListSelector, FormSection } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import {
  getGroupVersionKindForModel,
  ResourceIcon,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
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
import { QuickStartModel } from '../../models';

type DisabledQuickStartsConsoleConfig = K8sResourceKind & {
  spec: {
    customization?: {
      quickStarts?: {
        disabled: string[];
      };
    };
  };
};

type ItemProps = { id: string; quickStart?: QuickStart };

const Item: React.FC<ItemProps> = ({ id, quickStart }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    {quickStart ? (
      <>
        <ResourceIcon groupVersionKind={getGroupVersionKindForModel(QuickStartModel)} />
        <div>
          <div>{quickStart.spec.displayName || quickStart.metadata.name}</div>
          {quickStart.spec.displayName ? <div>{quickStart.metadata.name}</div> : null}
        </div>
      </>
    ) : (
      id
    )}
  </div>
);

const QuickStartConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  // All available quick starts
  const [allQuickStarts, allQuickStartsLoaded, allQuickStartsError] = useK8sWatchResource<
    QuickStart[]
  >({
    groupVersionKind: getGroupVersionKindForModel(QuickStartModel),
    isList: true,
  });

  // Current configuration
  const [consoleConfig, consoleConfigLoaded, consoleConfigError] = useConsoleOperatorConfig<
    DisabledQuickStartsConsoleConfig
  >();
  const [disabled, setDisabled] = React.useState<string[]>();
  React.useEffect(() => {
    if (consoleConfig && consoleConfigLoaded && !disabled) {
      setDisabled(consoleConfig?.spec?.customization?.quickStarts?.disabled || []);
    }
  }, [consoleConfig, consoleConfigLoaded, disabled]);

  // Calculate options
  const enabledOptions = React.useMemo<React.ReactElement<ItemProps>[]>(() => {
    if (!consoleConfigLoaded || !allQuickStartsLoaded || allQuickStartsError || !disabled) {
      return [];
    }
    return allQuickStarts
      .filter((quickStart) => !disabled || !disabled.includes(quickStart.metadata.name))
      .sort((quickStartA, quickStartB) => {
        const displayNameA = quickStartA.spec.displayName || quickStartA.metadata.name;
        const displayNameB = quickStartB.spec.displayName || quickStartB.metadata.name;
        return displayNameA.localeCompare(displayNameB);
      })
      .map((quickStart) => (
        <Item
          key={quickStart.metadata.name}
          id={quickStart.metadata.name}
          quickStart={quickStart}
        />
      ));
  }, [allQuickStarts, allQuickStartsError, allQuickStartsLoaded, consoleConfigLoaded, disabled]);
  const disabledOptions = React.useMemo<React.ReactElement<ItemProps>[]>(() => {
    if (!disabled) {
      return [];
    }
    const quickStartsByName = allQuickStarts.reduce<Record<string, QuickStart>>(
      (acc, quickStart) => {
        acc[quickStart.metadata.name] = quickStart;
        return acc;
      },
      {},
    );
    const sortedIds = [...disabled];
    sortedIds.sort((idA, idB) => {
      const quickStartA = quickStartsByName[idA];
      const quickStartB = quickStartsByName[idB];
      const displayNameA = quickStartA?.spec.displayName || quickStartA?.metadata.name || idA;
      const displayNameB = quickStartB?.spec.displayName || quickStartB?.metadata.name || idB;
      return displayNameA.localeCompare(displayNameB);
    });
    return sortedIds.map((id) => <Item key={id} id={id} quickStart={quickStartsByName[id]} />);
  }, [allQuickStarts, disabled]);

  // Save the latest value (disabled string array)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatusProps>();
  const save = useDebounceCallback(() => {
    fireTelemetryEvent('Console cluster configuration changed', {
      customize: 'Quick Starts',
      disabled,
    });
    setSaveStatus({ status: 'in-progress' });

    const patch: DisabledQuickStartsConsoleConfig = {
      spec: {
        customization: {
          quickStarts: {
            disabled,
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
    const displayName =
      option.props.quickStart?.spec.displayName ||
      option.props.quickStart?.metadata.name ||
      option.props.id;
    return fuzzy(input.toLocaleLowerCase(), displayName.toLocaleLowerCase());
  };

  return (
    <FormSection title={t('console-app~Quick starts')} data-test="quickstarts form-section">
      <DualListSelector
        availableOptionsTitle={t('console-app~Enabled')}
        chosenOptionsTitle={t('console-app~Disabled')}
        isSearchable
        availableOptions={enabledOptions}
        chosenOptions={disabledOptions}
        onListChange={onListChange}
        filterOption={filterOption}
        isDisabled={readonly || !allQuickStartsLoaded || !consoleConfigLoaded || consoleConfigError}
      />

      <LoadError error={consoleConfigError} />
      <SaveStatus {...saveStatus} />
    </FormSection>
  );
};

export default QuickStartConfiguration;
