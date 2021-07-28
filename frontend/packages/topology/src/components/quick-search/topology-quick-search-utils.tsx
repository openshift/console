import * as React from 'react';
import { QuickStart, QuickStartContext, QuickStartContextValues } from '@patternfly/quickstarts';
import { TextList, TextListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';

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
