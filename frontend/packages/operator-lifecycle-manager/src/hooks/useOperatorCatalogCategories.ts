import { useMemo } from 'react';
import * as _ from 'lodash';
import { CatalogCategory } from '@console/dynamic-plugin-sdk/src';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { OLMAnnotation } from '../components/operator-hub';
import { getCurrentCSVDescription } from '../utils/packagemanifests';
import { useOperatorHubPackageManifests } from './useOperatorHubPackageManifests';

const useOperatorCatalogCategories = (): CatalogCategory[] => {
  const [activeNamespace] = useActiveNamespace();
  const [packageManifests, loaded, loadError] = useOperatorHubPackageManifests(
    activeNamespace === ALL_NAMESPACES_KEY ? '' : activeNamespace,
  );
  return useMemo<CatalogCategory[]>(() => {
    if (!loaded) {
      return [];
    }
    if (loadError) {
      return [];
    }
    return packageManifests.reduce<CatalogCategory[]>((acc, packageManifest) => {
      const currentCSVDescription = getCurrentCSVDescription(packageManifest);
      const categories =
        currentCSVDescription.annotations[OLMAnnotation.Categories]?.split(',') || [];
      const catalogCategories = categories.map((c) => {
        const label = c.trim();
        const id = label.toLowerCase();
        if (c) {
          return {
            id,
            label,
            tags: [id],
          };
        }
        return null;
      });
      return _.uniqBy([...acc, ...catalogCategories], 'id');
    }, []);
  }, [packageManifests, loaded, loadError]);
};

export default useOperatorCatalogCategories;
