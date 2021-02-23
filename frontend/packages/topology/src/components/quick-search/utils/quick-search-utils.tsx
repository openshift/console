import * as React from 'react';
import { CatalogItem } from '@console/plugin-sdk';
import { keywordCompare } from '@console/dev-console/src/components/catalog/utils/catalog-utils';
import { QuickStart } from '@console/app/src/components/quick-starts/utils/quick-start-types';
import QuickStartTileDescription from '@console/app/src/components/quick-starts/catalog/QuickStartTileDescription';

export const quickSearch = (items: CatalogItem[], query: string) => {
  return items.filter((item) => keywordCompare(query, item));
};

export const getTransformedQuickStarts = (
  quickStarts: QuickStart[],
  setActiveQuickStart: (quickStartId: string, totalTasks?: number) => void,
): CatalogItem[] => {
  return quickStarts.map((qs: QuickStart) => {
    const description = (
      <QuickStartTileDescription
        description={qs.spec.description}
        prerequisites={qs.spec.prerequisites}
      />
    );
    return {
      name: qs.spec.displayName,
      type: 'Quick Start',
      uid: qs.metadata.uid,
      cta: {
        callback: () => setActiveQuickStart(qs.metadata.name, qs.spec.tasks?.length),
        label: 'Start',
      },
      icon: {
        url: qs.spec.icon,
      },
      description,
    };
  });
};
