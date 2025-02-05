import * as React from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import { Content } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { useQuickStartContext } from '@console/shared/src/hooks/useQuickStartContext';

export const useTransformedQuickStarts = (quickStarts: QuickStart[]): CatalogItem[] => {
  const { setActiveQuickStart } = useQuickStartContext();
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
                <Content component="ul">
                  {prerequisites.map((prerequisite, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Content component="li" key={index}>
                      {prerequisite}
                    </Content>
                  ))}
                </Content>
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
            url: qs.spec.icon as string,
          },
          description,
        };
      }),
    [t, quickStarts, setActiveQuickStart],
  );
};
