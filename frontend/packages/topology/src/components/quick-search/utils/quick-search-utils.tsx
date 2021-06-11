import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextList, TextListItem } from '@patternfly/react-core';
import { history, removeQueryArgument } from '@console/internal/components/utils';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { keywordCompare } from '@console/dev-console/src/components/catalog/utils/catalog-utils';
import { QuickStart } from '@console/app/src/components/quick-starts/utils/quick-start-types';
import {
  QuickStartContext,
  QuickStartContextValues,
} from '@console/app/src/components/quick-starts/utils/quick-start-context';

export const quickSearch = (items: CatalogItem[], query: string) => {
  return keywordCompare(query, items);
};

export const useTransformedQuickStarts = (quickStarts: QuickStart[]): CatalogItem[] => {
  const { setActiveQuickStart } = React.useContext<QuickStartContextValues>(QuickStartContext);
  const { t } = useTranslation();
  return React.useMemo(
    () =>
      quickStarts.map((qs: QuickStart) => {
        const prerequisites = qs.spec.prerequisites?.filter((p) => p);
        const description = (
          <>
            <p>{qs.spec.description}</p>
            {prerequisites?.length > 0 && (
              <>
                <h5>{t('topology~Prerequisites')}</h5>
                <TextList>
                  {prerequisites.map((prerequisite, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <TextListItem key={index}>{prerequisite}</TextListItem>
                  ))}
                </TextList>
              </>
            )}
          </>
        );
        return {
          name: qs.spec.displayName,
          type: t('topology~Quick Starts'),
          uid: qs.metadata.uid,
          cta: {
            callback: () => setActiveQuickStart(qs.metadata.name, qs.spec.tasks?.length),
            label: t('topology~Start'),
          },
          icon: {
            url: qs.spec.icon,
          },
          description,
        };
      }),
    [t, quickStarts, setActiveQuickStart],
  );
};

export const handleCta = (
  e: React.SyntheticEvent,
  item: CatalogItem,
  closeModal: () => void,
  fireTelemetryEvent: (event: string, properties?: {}) => void,
) => {
  e.preventDefault();
  const { href, callback } = item.cta;
  if (callback) {
    fireTelemetryEvent('Quick Search Used', {
      id: item.uid,
      type: item.type,
      name: item.name,
    });
    closeModal();
    callback();
    removeQueryArgument('catalogSearch');
  } else history.push(href);
};
