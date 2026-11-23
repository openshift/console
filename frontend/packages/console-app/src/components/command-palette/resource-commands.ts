import type { TFunction } from 'i18next';
import type {
  DiscoveryResources,
  ExtensionK8sGroupModel,
  K8sModel,
} from '@console/dynamic-plugin-sdk/src/api/common-types';
import { referenceForExtensionModel } from '@console/internal/module/k8s/k8s';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils/namespace';
import type { CommandPaletteCommand } from './types';

type GroupVersionMap = DiscoveryResources['groupVersionMap'];

type ResourceCommand = Extract<CommandPaletteCommand, { type: 'resource' }>;

const BLOCKED_GROUPS = new Set(['authorization.openshift.io']);

const BLOCKED_RESOURCES = new Set(['events.k8s.io/v1beta1.Event']);

const isVisible = (model: K8sModel): boolean =>
  !BLOCKED_GROUPS.has(model.apiGroup) &&
  !BLOCKED_RESOURCES.has(`${model.apiGroup}/${model.apiVersion}.${model.kind}`) &&
  (!model.verbs?.length || model.verbs.includes('list'));

const isPreferredVersion = (model: K8sModel, groupVersionMap: GroupVersionMap | undefined) =>
  groupVersionMap?.[model.apiGroup]?.preferredVersion === model.apiVersion;

const getGroupKindKey = (model: K8sModel): string => `${model.kind}~${model.apiGroup}`;

const getListableModels = (
  models: K8sModel[],
  groupVersionMap: GroupVersionMap | undefined,
): K8sModel[] => {
  const visibleModels = models.filter(isVisible);

  const groupKindsWithPreferredVersion = new Set(
    visibleModels
      .filter((model) => isPreferredVersion(model, groupVersionMap))
      .map(getGroupKindKey),
  );

  return visibleModels.filter(
    (model) =>
      !groupKindsWithPreferredVersion.has(getGroupKindKey(model)) ||
      isPreferredVersion(model, groupVersionMap),
  );
};

const isSameGroupKind = (model: K8sModel, navModel: ExtensionK8sGroupModel): boolean =>
  model.kind === navModel.kind && (model.apiGroup || 'core') === (navModel.group || 'core');

const getModelReference = (model: K8sModel): string =>
  referenceForExtensionModel({
    group: model.apiGroup,
    version: model.apiVersion,
    kind: model.kind,
  });

export const getModelPluralLabel = (model: K8sModel, t: TFunction): string =>
  model.labelPluralKey ? t(model.labelPluralKey) : model.labelPlural;

export const getModelAliases = (model: K8sModel): string[] =>
  [model.kind, ...(model.shortNames ?? [])].filter(Boolean);

export const getModelKeywords = (model: K8sModel): string[] =>
  [model.plural, model.apiGroup].filter(Boolean);

type ResourceCommandOptions = {
  models: K8sModel[];
  groupVersionMap: GroupVersionMap | undefined;
  navModels: ExtensionK8sGroupModel[];
  activeNamespace: string;
  t: TFunction;
};

export const buildResourceCommands = ({
  models,
  groupVersionMap,
  navModels,
  activeNamespace,
  t,
}: ResourceCommandOptions): ResourceCommand[] =>
  getListableModels(models, groupVersionMap)
    .filter((model) => !navModels.some((navModel) => isSameGroupKind(model, navModel)))
    .map((model) => {
      const reference = getModelReference(model);

      return {
        type: 'resource',
        id: `resource:${reference}`,
        title: getModelPluralLabel(model, t),
        aliases: getModelAliases(model),
        keywords: getModelKeywords(model),
        model,
        href: model.namespaced
          ? formatNamespacedRouteForResource(reference, activeNamespace)
          : `/k8s/cluster/${reference}`,
      };
    });
