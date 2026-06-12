import type { FC } from 'react';
import { CardHeader, Content, ContentVariants, PageSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { GettingStartedExpandableGrid } from '@console/shared/src/components/getting-started/GettingStartedExpandableGrid';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { FUNCTIONS_GETTING_STARTED_SECTION_USER_PREFERENCE_KEY } from '../../const';
import { FunctionsDocsGettingStartedCard } from './FunctionsDocsGettingStartedCard';
import { QuickStartGettingStartedCard } from './QuickStartGettingStartedCard';
import { SampleGettingStartedCard } from './SamplesGettingStartedCard';

export const GettingStartedSection: FC = () => {
  const { t } = useTranslation('knative-plugin');

  const [isGettingStartedSectionOpen, setIsGettingStartedSectionOpen] = useUserPreference<boolean>(
    FUNCTIONS_GETTING_STARTED_SECTION_USER_PREFERENCE_KEY,
    true,
  );

  return (
    <PageSection className="pf-v6-u-pt-0">
      <GettingStartedExpandableGrid
        setIsOpen={setIsGettingStartedSectionOpen}
        isOpen={isGettingStartedSectionOpen}
        title={<>{t('Get started with functions')}</>}
        headerContent={
          <CardHeader>
            <Content component={ContentVariants.h4}>
              {t('Choose how to create a function from below methods')}
            </Content>
          </CardHeader>
        }
        titleTooltip={false}
      >
        <SampleGettingStartedCard />
        <QuickStartGettingStartedCard
          featured={['serverless-functions-using-cli', 'serverless-functions-using-ide']}
          title={t('Create function with guided documentation')}
          description={t(
            'knative-plugin~Follow guided documentation to create serverless functions.',
          )}
        />
        <FunctionsDocsGettingStartedCard />
      </GettingStartedExpandableGrid>
    </PageSection>
  );
};
