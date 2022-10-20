import * as React from 'react';
import { DualListSelector, FormSection } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import {
  getGroupVersionKindForModel,
  K8sResourceCommon,
  ResourceIcon,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { ClusterRoleModel } from '@console/internal/models';
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

const defaultClusterRoleNames = ['admin', 'edit', 'view'];

type DeveloperCatalogClusterRolesConfig = K8sResourceKind & {
  spec: {
    customization?: {
      projectAccess?: {
        availableClusterRoles?: string[];
      };
    };
  };
};

type ItemProps = { name: string; clusterRole?: K8sResourceCommon };

const getDisplayName = (clusterRole?: K8sResourceCommon, name?: string) =>
  clusterRole?.metadata.annotations?.['console.openshift.io/display-name'] ||
  clusterRole?.metadata.name ||
  name;

const Item: React.FC<ItemProps> = ({ name, clusterRole }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    {clusterRole ? (
      <ResourceIcon groupVersionKind={getGroupVersionKindForModel(ClusterRoleModel)} />
    ) : null}
    <div>{getDisplayName(clusterRole, name)}</div>
  </div>
);

const ProjectAccessRolesConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();

  // Available cluster roles
  const [allClusterRoles, allClusterRolesLoaded, allClusterRolesError] = useK8sWatchResource<
    K8sResourceCommon[]
  >({
    groupVersionKind: getGroupVersionKindForModel(ClusterRoleModel),
    isList: true,
  });
  const sortedClusterRoles = React.useMemo(() => {
    const clusterRoles = allClusterRoles ? [...allClusterRoles] : [];
    clusterRoles.sort((clusterRoleA, clusterRoleB) => {
      const displayNameA = getDisplayName(clusterRoleA);
      const displayNameB = getDisplayName(clusterRoleB);
      return displayNameA.localeCompare(displayNameB);
    });
    return clusterRoles;
  }, [allClusterRoles]);

  // Current configuration
  const [consoleConfig, consoleConfigLoaded, consoleConfigError] = useConsoleOperatorConfig<
    DeveloperCatalogClusterRolesConfig
  >();
  const [selectedClusterRoles, setSelectedClusterRoles] = React.useState<string[]>();
  React.useEffect(() => {
    if (consoleConfig && consoleConfigLoaded && !selectedClusterRoles) {
      setSelectedClusterRoles(
        consoleConfig?.spec?.customization?.projectAccess?.availableClusterRoles || [],
      );
    }
  }, [selectedClusterRoles, consoleConfig, consoleConfigLoaded]);

  // Calculate options
  const availableOptions = React.useMemo<React.ReactElement<ItemProps>[]>(() => {
    if (
      !consoleConfigLoaded ||
      !allClusterRolesLoaded ||
      allClusterRolesError ||
      !selectedClusterRoles
    ) {
      return [];
    }
    const hideClusterRoleNames =
      selectedClusterRoles.length === 0 ? defaultClusterRoleNames : selectedClusterRoles;
    return sortedClusterRoles
      .filter((clusterRole) => !hideClusterRoleNames.includes(clusterRole.metadata.name))
      .map((clusterRole) => (
        <Item
          key={clusterRole.metadata.name}
          name={clusterRole.metadata.name}
          clusterRole={clusterRole}
        />
      ));
  }, [
    sortedClusterRoles,
    allClusterRolesError,
    allClusterRolesLoaded,
    selectedClusterRoles,
    consoleConfigLoaded,
  ]);
  const chosenOptions = React.useMemo<React.ReactElement<ItemProps>[]>(() => {
    if (!selectedClusterRoles) {
      return [];
    }
    const allClusterRolesByName = allClusterRoles.reduce<Record<string, K8sResourceCommon>>(
      (acc, clusterRole) => {
        acc[clusterRole.metadata.name] = clusterRole;
        return acc;
      },
      {},
    );
    const clusterRoleNames =
      selectedClusterRoles.length === 0 ? defaultClusterRoleNames : selectedClusterRoles;
    return clusterRoleNames.map((name) => (
      <Item key={name} name={name} clusterRole={allClusterRolesByName[name]} />
    ));
  }, [allClusterRoles, selectedClusterRoles]);

  // Save the latest value (disabled string array)
  const [saveStatus, setSaveStatus] = React.useState<SaveStatusProps>();
  const save = useDebounceCallback(() => {
    fireTelemetryEvent('Console cluster configuration changed', {
      customize: 'Project Access cluster roles',
      roles: selectedClusterRoles?.length > 0 ? selectedClusterRoles : null,
    });
    setSaveStatus({ status: 'in-progress' });

    const patch: DeveloperCatalogClusterRolesConfig = {
      spec: {
        customization: {
          projectAccess: {
            availableClusterRoles: selectedClusterRoles?.length > 0 ? selectedClusterRoles : null,
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
    setSelectedClusterRoles(newDisabledOptions.map((node) => node.props.name));
    setSaveStatus({ status: 'pending' });
    save();
  };

  const filterOption = (option: React.ReactElement<ItemProps>, input: string): boolean => {
    const displayName = getDisplayName(option.props.clusterRole, option.props.name);
    return fuzzy(input.toLocaleLowerCase(), displayName.toLocaleLowerCase());
  };

  return (
    <FormSection
      title={t('devconsole~Project access')}
      data-test="project-access-roles form-section"
    >
      <DualListSelector
        availableOptionsTitle={t('devconsole~Available Cluster Roles')}
        chosenOptionsTitle={t('devconsole~Chosen Cluster Roles')}
        isSearchable
        availableOptions={availableOptions}
        chosenOptions={chosenOptions}
        onListChange={onListChange}
        filterOption={filterOption}
        isDisabled={
          readonly || !allClusterRolesLoaded || !consoleConfigLoaded || consoleConfigError
        }
      />

      <LoadError error={consoleConfigError} />
      <SaveStatus {...saveStatus} />
    </FormSection>
  );
};

export default ProjectAccessRolesConfiguration;
