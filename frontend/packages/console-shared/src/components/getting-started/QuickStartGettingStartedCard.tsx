import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteIcon } from '@patternfly/react-icons';

import {
  GettingStartedCard,
  GettingStartedLink,
} from '@console/shared/src/components/getting-started';
import QuickStartsLoader from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';
import {
  AllQuickStartStates,
  QuickStart,
  QuickStartStatus,
} from '@console/app/src/components/quick-starts/utils/quick-start-types';
import {
  QuickStartContext,
  QuickStartContextValues,
} from '@console/app/src/components/quick-starts/utils/quick-start-context';
import { getQuickStartStatus } from '@console/app/src/components/quick-starts/utils/quick-start-utils';

interface QuickStartGettingStartedCardProps {
  featured?: string[];
}

const orderQuickStarts = (
  allQuickStarts: QuickStart[],
  allQuickStartStates: AllQuickStartStates,
  featured: string[],
): QuickStart[] => {
  const orderedQuickStarts: QuickStart[] = [];

  const isFeatured = (quickStart: QuickStart) => featured?.includes(quickStart.metadata.name);
  const getStatus = (quickStart: QuickStart) =>
    getQuickStartStatus(allQuickStartStates, quickStart.metadata.name);

  // Prioritze featured quick start an keep specifified order.
  if (featured) {
    const featuredQuickStartsByName = allQuickStarts.reduce((acc, q) => {
      acc[q.metadata.name] = q;
      return acc;
    }, {} as Record<string, QuickStart>);
    featured.forEach((quickStartName) => {
      if (
        featuredQuickStartsByName[quickStartName] &&
        getStatus(featuredQuickStartsByName[quickStartName]) !== QuickStartStatus.COMPLETE
      ) {
        orderedQuickStarts.push(featuredQuickStartsByName[quickStartName]);
      }
    });
  }

  // Show other in progress quick starts (which are not featured)
  orderedQuickStarts.push(
    ...allQuickStarts.filter(
      (q) => !isFeatured(q) && getStatus(q) === QuickStartStatus.IN_PROGRESS,
    ),
  );

  // Show other not started quick starts (which are not featured)
  orderedQuickStarts.push(
    ...allQuickStarts.filter(
      (q) => !isFeatured(q) && getStatus(q) === QuickStartStatus.NOT_STARTED,
    ),
  );

  return orderedQuickStarts;
};

export const QuickStartGettingStartedCard: React.FC<QuickStartGettingStartedCardProps> = ({
  featured,
}) => {
  const { t } = useTranslation();
  const { allQuickStartStates, setActiveQuickStart } = React.useContext<QuickStartContextValues>(
    QuickStartContext,
  );

  return (
    <QuickStartsLoader>
      {(quickStarts, loaded) => {
        const orderedQuickStarts = orderQuickStarts(quickStarts, allQuickStartStates, featured);
        const slicedQuickStarts = orderedQuickStarts.slice(0, 2);

        if (loaded && slicedQuickStarts.length === 0) {
          return null;
        }

        const links: GettingStartedLink[] = loaded
          ? slicedQuickStarts.map((quickStart: QuickStart) => ({
              id: quickStart.metadata.name,
              title: quickStart.spec.displayName,
              onClick: () => {
                setActiveQuickStart(quickStart.metadata.name, quickStart.spec.tasks.length);
              },
            }))
          : featured?.map((name) => ({
              id: name,
              loading: true,
            }));

        const moreLink: GettingStartedLink = {
          id: 'all-quick-starts',
          title: t('console-shared~View all quick starts'),
          href: '/quickstart',
        };

        return (
          <GettingStartedCard
            id="quick-start"
            icon={<RouteIcon color="var(--pf-global--palette--purple-600)" aria-hidden="true" />}
            title={t('console-shared~Build with guided documentation')}
            titleColor={'var(--pf-global--palette--purple-700)'}
            description={t(
              'console-shared~Follow guided documentation to build applications and familiarize yourself with key features.',
            )}
            links={links}
            moreLink={moreLink}
          />
        );
      }}
    </QuickStartsLoader>
  );
};
