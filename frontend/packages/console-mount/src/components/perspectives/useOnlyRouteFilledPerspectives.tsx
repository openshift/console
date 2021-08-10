import {
  isNavItem,
  isNavSection,
  NavItem,
  NavSection as PluginNavSection,
  Separator,
  Perspective,
  isPerspective,
  useResolvedExtensions,
  ResolvedExtension,
} from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk';

const useOnlyRouteFilledPerspectives = (): ResolvedExtension<Perspective>[] => {
  const [perspectiveExtensions, loaded] = useResolvedExtensions<Perspective>(isPerspective);
  const allItems = useExtensions<PluginNavSection | NavItem | Separator>(isNavSection, isNavItem);

  if (!loaded) return [];

  const perspectiveTotals = allItems.reduce((acc, item) => {
    const perspective = item.properties?.perspective;
    if (!perspective) return acc;
    const updatedTotal = (acc[perspective] ? acc[perspective] : 0) + 1;

    return {
      ...acc,
      [perspective]: updatedTotal,
    };
  }, {});

  return perspectiveExtensions.filter(({ properties: { id } }) => perspectiveTotals[id] > 0);
};

export default useOnlyRouteFilledPerspectives;
