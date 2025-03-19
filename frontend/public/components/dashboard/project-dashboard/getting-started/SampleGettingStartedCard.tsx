import * as React from 'react';
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons/catalog-icon';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { ALL_NAMESPACES_KEY, CatalogServiceProvider, isCatalogTypeEnabled } from '@console/shared';
import {
  GettingStartedLink,
  GettingStartedCard,
} from '@console/shared/src/components/getting-started';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { SAMPLE_CATALOG_TYPE_ID } from '@console/dev-console/src/const';
import { getDisabledAddActions } from '@console/dev-console/src/utils/useAddActionExtensions';

interface SampleGettingStartedCardProps {
  featured?: string[];
}

const orderCatalogItems = (allCatalogItems: CatalogItem[], featured: string[]): CatalogItem[] => {
  const orderedCatalogItems: CatalogItem[] = [];

  const isNotFeatured = (catalogItem: CatalogItem) => !featured?.includes(catalogItem.uid);

  // Prioritze featured catalog items
  if (featured) {
    const featuredQuickStartsByName = allCatalogItems.reduce((acc, ci) => {
      acc[ci.uid] = ci;
      return acc;
    }, {} as Record<string, CatalogItem>);
    featured.forEach((uid) => {
      if (featuredQuickStartsByName[uid]) {
        orderedCatalogItems.push(featuredQuickStartsByName[uid]);
      }
    });
  }

  // All all other catalog items
  orderedCatalogItems.push(...allCatalogItems.filter(isNotFeatured));

  return orderedCatalogItems;
};

export const SampleGettingStartedCard: React.FC<SampleGettingStartedCardProps> = ({
  featured = [],
}) => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();
  const isSampleTypeEnabled = isCatalogTypeEnabled(SAMPLE_CATALOG_TYPE_ID);

  const disabledAddActions = getDisabledAddActions();
  if (disabledAddActions?.includes('import-from-samples') || !isSampleTypeEnabled) {
    return null;
  }

  const moreLink: GettingStartedLink = {
    id: 'all-samples',
    title: t('public~View all samples'),
    href:
      activeNamespace && activeNamespace !== ALL_NAMESPACES_KEY
        ? `/samples/ns/${activeNamespace}`
        : '/samples/all-namespaces',
  };

  return (
    <CatalogServiceProvider namespace={activeNamespace} catalogId="samples-catalog">
      {(service) => {
        const orderedCatalogItems = orderCatalogItems(service.items || [], featured);
        const slicedCatalogItems = orderedCatalogItems.slice(0, 2);

        if (service.loaded && slicedCatalogItems.length === 0) {
          return null;
        }

        const links: GettingStartedLink[] = service.loaded
          ? slicedCatalogItems.map((item) => {
              return {
                id: item.uid,
                title: item.name,
                href: item.cta?.href,
                onClick: item.cta?.callback,
              };
            })
          : featured.map((uid) => {
              return {
                id: uid,
                loading: true,
              };
            });

        return (
          <GettingStartedCard
            id="samples"
            icon={<CatalogIcon color="var(--co-global--palette--blue-400)" aria-hidden="true" />}
            title={t('public~Create applications using samples')}
            titleColor={'var(--co-global--palette--blue-400)'}
            description={t(
              'public~Choose a code sample to get started creating an application with.',
            )}
            links={links}
            moreLink={moreLink}
          />
        );
      }}
    </CatalogServiceProvider>
  );
};
