import * as React from 'react';
import { DualListSelector, FormHelperText, FormSection, Tooltip } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { Map as ImmutableMap, Set as ImmutableSet } from 'immutable';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  DiscoveryResources,
  ExtensionK8sModel,
  K8sKind,
  K8sModel,
  ResourceIcon,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import {
  K8sResourceKind,
  modelFor,
  referenceForGroupVersionKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { YellowExclamationTriangleIcon, useTelemetry } from '@console/shared';
import {
  useDebounceCallback,
  useConsoleOperatorConfig,
  LoadError,
  SaveStatus,
  SaveStatusProps,
  patchConsoleOperatorConfig,
} from '@console/shared/src/components/cluster-configuration';
import {
  Perspective,
  PerspectivePinnedResource,
  PerspectiveVisibilityState,
  usePerspectives,
} from '@console/shared/src/hooks/perspective-utils';
import './PinnedResourcesConfiguration.scss';

// skip duplicate resources.
const skipGroups = ImmutableSet([
  // Prefer rbac.authorization.k8s.io/v1, which has the same resources.
  'authorization.openshift.io',
]);

const skipResources = ImmutableSet([
  // Prefer core/v1
  'events.k8s.io/v1beta1.Event',
]);

type PerspectivesConsoleConfig = K8sResourceKind & {
  spec: {
    customization?: {
      perspectives: Perspective[];
    };
  };
};

type DefaultPins = {
  dev?: ExtensionK8sModel[];
};

type PinnedResourcesConfigurationProps = {
  readonly: boolean;
  groupVersionMap: DiscoveryResources['groupVersionMap'];
  allK8sModels: ImmutableMap<string, K8sModel>;
};

const PinnedResourcesConfiguration: React.FC<PinnedResourcesConfigurationProps> = ({
  readonly,
  allK8sModels,
  groupVersionMap,
}) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const perspectiveExtensions = usePerspectives();
  const [pinnedResources, setPinnedResources] = React.useState<PerspectivePinnedResource[]>();
  const [perspectiveData, setPerspectiveData] = React.useState<Perspective[]>();
  const [pinnedResourcesConfigured, setPinnedResourcesConfigured] = React.useState<
    PerspectivePinnedResource[]
  >();
  const defaultPins: DefaultPins = React.useMemo(
    () =>
      perspectiveExtensions.reduce(
        (acc, e) => ({
          ...acc,
          [e.properties.id]: (e.properties.defaultPins || []).map((gvk) => gvk),
        }),
        {},
      ),
    [perspectiveExtensions],
  );

  const resources = React.useMemo(() => {
    return allK8sModels
      ?.filter(({ apiGroup, apiVersion, kind, verbs }) => {
        if (skipGroups.has(apiGroup) || skipResources.has(`${apiGroup}/${apiVersion}.${kind}`)) {
          return false;
        }

        // Only show resources that can be listed.
        if (!verbs?.some((v) => v === 'list')) {
          return false;
        }

        // Only show preferred version for resources in the same API group.
        const preferred = (m: K8sKind) =>
          groupVersionMap?.[m.apiGroup]?.preferredVersion === m.apiVersion;

        const sameGroupKind = (m: K8sKind) =>
          m.kind === kind && m.apiGroup === apiGroup && m.apiVersion !== apiVersion;

        return !allK8sModels.find((m) => sameGroupKind(m) && preferred(m));
      })
      .toOrderedMap()
      .sortBy(({ kind, apiGroup }) => `${kind} ${apiGroup}`);
  }, [allK8sModels, groupVersionMap]);

  // Track duplicate names so we know when to show the group.
  const kinds = resources.groupBy((m) => m.kind);
  const isDup = (kind) => kinds.get(kind).size > 1;

  type ItemProps = { title?: string; model?: K8sKind };

  const Item: React.FC<ItemProps> = ({ model }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span className="co-resource-item">
        <span className="co-resource-icon--fixed-width">
          <ResourceIcon kind={referenceForModel(model)} />
        </span>
        <span className="co-resource-item__resource-name">
          <span>
            {model.labelKey ? t(model.labelKey) : model.kind}
            {model.badge && model.badge === 'Tech Preview' && (
              <span className="co-resource-item__tech-dev-preview">{t('public~Tech Preview')}</span>
            )}
          </span>
          {isDup(model.kind) && (
            <div className="co-resource-item__resource-api text-muted co-truncate co-nowrap small">
              {model.apiGroup || 'core'}/{model.apiVersion}
            </div>
          )}
        </span>
      </span>
    </div>
  );

  const InvalidItem: React.FC<ItemProps> = ({ title }) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span className="co-resource-icon--fixed-width">
        <Tooltip position="top" content={t('devconsole~Resource not found')}>
          <YellowExclamationTriangleIcon size="md" />
        </Tooltip>
      </span>
      <span className="co-resource-item__resource-name">
        <span>{title}</span>
      </span>
    </div>
  );

  const [consoleConfig, consoleConfigLoaded, consoleConfigError] = useConsoleOperatorConfig<
    PerspectivesConsoleConfig
  >();

  const [configuredPerspectives, setConfiguredPerspectives] = React.useState<Perspective[]>();
  React.useEffect(() => {
    if (consoleConfig && consoleConfigLoaded && !configuredPerspectives) {
      const perspectiveDetails = consoleConfig?.spec?.customization?.perspectives;
      const devPerspective = perspectiveDetails?.find((p) => p.id === 'dev');
      let defaultPinnedResources = [];
      if (!devPerspective || !devPerspective?.pinnedResources) {
        if (defaultPins?.dev) {
          const getModels = defaultPins?.dev.map((groupVersionKind) => {
            const ref = groupVersionKind?.group
              ? referenceForGroupVersionKind(groupVersionKind.group)(groupVersionKind.version)(
                  groupVersionKind.kind,
                )
              : groupVersionKind.kind;
            return modelFor(ref);
          });
          defaultPinnedResources = getModels?.map((resource) => {
            return {
              group: resource?.apiGroup ? resource?.apiGroup : '',
              version: resource?.apiVersion,
              resource: resource?.plural,
            };
          });
        }
        setPinnedResources(defaultPinnedResources);
        setPinnedResourcesConfigured(defaultPinnedResources);
      } else {
        setPinnedResources(devPerspective.pinnedResources);
        setPinnedResourcesConfigured(devPerspective.pinnedResources);
        setConfiguredPerspectives(consoleConfig?.spec?.customization?.perspectives);
      }
    }
  }, [configuredPerspectives, consoleConfig, consoleConfigLoaded, defaultPins]);

  const items = React.useMemo(() => {
    return resources
      .map((model: K8sKind) => {
        return <Item title={model.labelKey ? t(model.labelKey) : model.kind} model={model} />;
      })
      .toArray();
  }, [resources, t]);

  const availableResources = React.useMemo<React.ReactElement<ItemProps>[]>(() => {
    if (!consoleConfigLoaded) {
      return [];
    }
    return items
      ? items.filter(
          (item) =>
            !pinnedResources?.find(
              (pinnedResource) =>
                pinnedResource?.resource === item?.props?.model?.plural &&
                (pinnedResource?.group === item?.props?.model?.apiGroup ||
                  (!item?.props?.model?.apiGroup && pinnedResource?.group === '')) &&
                pinnedResource?.version === item?.props?.model?.apiVersion,
            ),
        )
      : [];
  }, [consoleConfigLoaded, items, pinnedResources]);

  const prePinnedResources = React.useMemo<React.ReactElement<ItemProps>[]>(() => {
    if (!consoleConfigLoaded) {
      return [];
    }
    let configuredResources = pinnedResources?.map((pinnedResource) => {
      const itemForResource = items?.find(
        (item) =>
          pinnedResource?.resource === item?.props?.model?.plural &&
          (pinnedResource?.group === item?.props?.model?.apiGroup ||
            (!item?.props?.model?.apiGroup && pinnedResource?.group === '')) &&
          pinnedResource?.version === item?.props?.model?.apiVersion,
      );
      return itemForResource || <InvalidItem title={pinnedResource?.resource} />;
    });
    configuredResources = configuredResources?.filter((element) => element !== undefined);
    return configuredResources || [];
  }, [consoleConfigLoaded, items, pinnedResources]);

  const [saveStatus, setSaveStatus] = React.useState<SaveStatusProps>();
  const save = useDebounceCallback(() => {
    fireTelemetryEvent('Console cluster configuration changed', {
      customize: 'Pre-pinned navigation items',
      pinnedResources,
    });
    setSaveStatus({ status: 'in-progress' });
    const patch: PerspectivesConsoleConfig = {
      spec: {
        customization: {
          perspectives: perspectiveData,
        },
      },
    };

    patchConsoleOperatorConfig(patch)
      .then(() => {
        setPinnedResourcesConfigured(pinnedResources);
        setSaveStatus({ status: 'successful' });
      })
      .catch((error) => {
        setPinnedResources(pinnedResourcesConfigured);
        setSaveStatus({ status: 'error', error });
      });
  }, 2000);

  const onListChange = (
    newEnabledOptions: React.ReactElement<ItemProps>[],
    newDisabledOptions: React.ReactElement<ItemProps>[],
  ) => {
    const validResources = newDisabledOptions.filter((item) => item?.props?.model);
    const newPinnedResources = validResources?.map((resource) => {
      return {
        group: resource?.props?.model?.apiGroup ? resource?.props?.model?.apiGroup : '',
        version: resource?.props?.model?.apiVersion,
        resource: resource?.props?.model?.plural,
      };
    });
    setPerspectiveData(() => {
      const newConfiguredPerspectives = configuredPerspectives ? [...configuredPerspectives] : [];
      const devPerspective = newConfiguredPerspectives?.find((p) => p.id === 'dev');
      if (!devPerspective) {
        newConfiguredPerspectives.push({
          id: 'dev',
          visibility: { state: PerspectiveVisibilityState.Enabled },
          pinnedResources: newPinnedResources,
        });
      } else {
        devPerspective.pinnedResources = newPinnedResources;
      }
      return newConfiguredPerspectives;
    });

    setPinnedResources(newPinnedResources);
    setSaveStatus({ status: 'pending' });
    save();
  };

  const filterOption = (option: React.ReactElement<ItemProps>, input: string): boolean => {
    return fuzzy(input?.toLocaleLowerCase(), option?.props?.title.toLocaleLowerCase());
  };

  return (
    <FormSection
      title={t('devconsole~Pre-pinned navigation items')}
      data-test="pinned-resource form-section"
    >
      <FormHelperText isHidden={false}>
        {t(
          'devconsole~As admin you can change the pinned resources that are shown to users by default. Users can still override this configuration and add or reorder their pinned resources. As soon as a user changes the default settings, new default settings are no longer applied.',
        )}
      </FormHelperText>
      <DualListSelector
        availableOptionsTitle={t('devconsole~Available Resources')}
        chosenOptionsTitle={t('devconsole~Pinned Resources')}
        isSearchable
        availableOptions={availableResources}
        chosenOptions={prePinnedResources}
        onListChange={onListChange}
        filterOption={filterOption}
        isDisabled={readonly || !consoleConfigLoaded || !!consoleConfigError}
      />

      <LoadError error={consoleConfigError} />
      <SaveStatus {...saveStatus} />
    </FormSection>
  );
};

const mapStateToProps = (state: RootState) => ({
  groupVersionMap: state.k8s.getIn(['RESOURCES', 'groupToVersionMap']),
  allK8sModels: state.k8s.getIn(['RESOURCES', 'models']),
});

export default connect(mapStateToProps)(PinnedResourcesConfiguration);
