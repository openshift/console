import type { TFunction } from 'i18next';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { ALL_NAMESPACES_KEY } from '@console/dynamic-plugin-sdk/src/constants';
import type {
  HrefNavItem,
  NavExtension,
  ResourceNavItem,
} from '@console/dynamic-plugin-sdk/src/extensions/navigation';
import {
  isHrefNavItem,
  isNavSection,
  isResourceNavItem,
  isResourceNSNavItem,
} from '@console/dynamic-plugin-sdk/src/extensions/navigation';
import type { Perspective } from '@console/dynamic-plugin-sdk/src/extensions/perspectives';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { referenceForExtensionModel } from '@console/internal/module/k8s/k8s';
import {
  formatNamespacedRouteForHref,
  formatNamespacedRouteForResource,
} from '@console/shared/src/utils/namespace';
import { getSortedNavExtensions, isTopLevelNavItem, stripScopeFromPath } from '../nav/utils';
import { getModelAliases, getModelKeywords, getModelPluralLabel } from './resource-commands';
import type { CommandPaletteCommand } from './types';

type PageCommand = Extract<CommandPaletteCommand, { type: 'page' }>;

type PageNavItem = LoadedExtension<HrefNavItem | ResourceNavItem>;

type SidebarItem = {
  item: PageNavItem;
  section?: string;
};

export type PagePerspective = Pick<Perspective['properties'], 'id' | 'default'>;

type PageCommandOptions = {
  navExtensions: LoadedExtension<NavExtension>[];
  perspectives: PagePerspective[];
  activePerspective: string;
  activeNamespace: string;
  lastNamespace: string | null;
  models: { [key: string]: K8sModel };
  t: TFunction;
};

const isPageNavItem = (extension: LoadedExtension<NavExtension>): extension is PageNavItem =>
  isHrefNavItem(extension) || isResourceNavItem(extension);

const belongsToPerspective = (
  extension: LoadedExtension<NavExtension>,
  perspective: PagePerspective,
): boolean =>
  extension.properties.perspective === perspective.id ||
  (!extension.properties.perspective && !!perspective.default);

const getSidebarItems = (extensions: LoadedExtension<NavExtension>[]): SidebarItem[] =>
  getSortedNavExtensions(extensions.filter(isTopLevelNavItem)).flatMap((topLevelItem) => {
    if (isNavSection(topLevelItem)) {
      const sectionItems = extensions.filter(
        (extension) =>
          !isNavSection(extension) && extension.properties.section === topLevelItem.properties.id,
      );

      return getSortedNavExtensions(sectionItems)
        .filter(isPageNavItem)
        .map((item) => ({ item, section: topLevelItem.properties.name }));
    }

    return isPageNavItem(topLevelItem) ? [{ item: topLevelItem }] : [];
  });

const getHrefItemHref = (
  { href, namespaced, prefixNamespaced }: HrefNavItem['properties'],
  activeNamespace: string,
): string => {
  if (namespaced) {
    return formatNamespacedRouteForHref(href, activeNamespace);
  }

  if (prefixNamespaced) {
    return formatNamespacedRouteForResource(stripScopeFromPath(href), activeNamespace);
  }

  return href;
};

const getResourceItemHref = (
  item: LoadedExtension<ResourceNavItem>,
  activeNamespace: string,
  lastNamespace: string | null,
): string => {
  const reference = referenceForExtensionModel(item.properties.model);

  return isResourceNSNavItem(item)
    ? formatNamespacedRouteForResource(
        reference,
        lastNamespace === ALL_NAMESPACES_KEY ? lastNamespace : activeNamespace,
      )
    : `/k8s/cluster/${reference}`;
};

const toPageCommands = (
  { item, section }: SidebarItem,
  perspective: string,
  { activeNamespace, lastNamespace, models, t }: PageCommandOptions,
): PageCommand[] => {
  const sectionKeywords = section ? [section] : [];

  if (isHrefNavItem(item)) {
    return [
      {
        type: 'page',
        id: `page:${item.uid}`,
        title: item.properties.name,
        aliases: [],
        keywords: sectionKeywords,
        section,
        perspective,
        href: getHrefItemHref(item.properties, activeNamespace),
      },
    ];
  }

  const { model: navModel, name } = item.properties;
  const model = models[referenceForExtensionModel(navModel)] ?? models[navModel.kind ?? ''];
  const title = name || (model ? getModelPluralLabel(model, t) : undefined);

  if (!title) {
    return [];
  }

  return [
    {
      type: 'page',
      id: `page:${item.uid}`,
      title,
      aliases: model ? getModelAliases(model) : [],
      keywords: [...sectionKeywords, ...(model ? getModelKeywords(model) : [])],
      section,
      perspective,
      href: getResourceItemHref(item, activeNamespace, lastNamespace),
      navModel: { group: navModel.group, kind: navModel.kind },
    },
  ];
};

export const buildPageCommands = (options: PageCommandOptions): PageCommand[] => {
  const { navExtensions, perspectives, activePerspective } = options;

  const commands = perspectives.flatMap((perspective) =>
    getSidebarItems(
      navExtensions.filter((extension) => belongsToPerspective(extension, perspective)),
    ).flatMap((sidebarItem) => toPageCommands(sidebarItem, perspective.id, options)),
  );

  const activePerspectiveHrefs = new Set(
    commands
      .filter((command) => command.perspective === activePerspective)
      .map((command) => command.href),
  );

  return commands.filter(
    (command) =>
      command.perspective === activePerspective || !activePerspectiveHrefs.has(command.href),
  );
};
