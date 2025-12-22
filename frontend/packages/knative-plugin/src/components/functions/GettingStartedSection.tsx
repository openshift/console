import type { FC } from 'react';
import { CardHeader, Content, ContentVariants, PageSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { GettingStartedExpandableGrid, useUserSettings } from '@console/shared';
import { FUNCTIONS_GETTING_STARTED_SECTION_USER_SETTING_KEY } from '../../const';
import { FunctionsDocsGettingStartedCard } from './FunctionsDocsGettingStartedCard';
import { QuickStartGettingStartedCard } from './QuickStartGettingStartedCard';
import { SampleGettingStartedCard } from './SamplesGettingStartedCard';

export const GettingStartedSection: FC = () => {
  const { t } = useTranslation();

  const [isGettingStartedSectionOpen, setIsGettingStartedSectionOpen] = useUserSettings<boolean>(
    FUNCTIONS_GETTING_STARTED_SECTION_USER_SETTING_KEY,
    true,
  );

  return (
    <PageSection className="pf-v6-u-pt-0">
      <GettingStartedExpandableGrid
        setIsOpen={setIsGettingStartedSectionOpen}
        isOpen={isGettingStartedSectionOpen}
        title={<>{t('knative-plugin~Get started with functions')}</>}
        headerContent={
          <CardHeader>
            <Content component={ContentVariants.h4}>
              {t('knative-plugin~Choose how to create a function from below methods')}
            </Content>
          </CardHeader>
        }
        titleTooltip={false}
      >
        <SampleGettingStartedCard />
        <QuickStartGettingStartedCard
          featured={['serverless-functions-using-cli', 'serverless-functions-using-ide']}
          title={t('knative-plugin~Create function with guided documentation')}
          description={t(
            'knative-plugin~Follow guided documentation to create serverless functions.',
          )}
        />
        <FunctionsDocsGettingStartedCard />
      </GettingStartedExpandableGrid>
    </PageSection>
  );
};
