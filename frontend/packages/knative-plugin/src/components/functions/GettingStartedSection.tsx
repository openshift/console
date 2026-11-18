import type { FC } from 'react';
import { MultiContentCard } from '@patternfly/react-component-groups';
import { CardTitle, Content, ContentVariants, PageSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { FUNCTIONS_GETTING_STARTED_SECTION_USER_PREFERENCE_KEY } from '../../const';
import { FunctionsDocsGettingStartedCard } from './FunctionsDocsGettingStartedCard';
import { QuickStartGettingStartedCard } from './QuickStartGettingStartedCard';
import { SampleGettingStartedCard } from './SamplesGettingStartedCard';

import './GettingStartedSection.scss';

export const GettingStartedSection: FC = () => {
  const { t } = useTranslation('knative-plugin');

  const [isGettingStartedSectionOpen, setIsGettingStartedSectionOpen, isPreferenceLoaded] =
    useUserPreference<boolean>(FUNCTIONS_GETTING_STARTED_SECTION_USER_PREFERENCE_KEY, true);

  // Defer rendering until the preference has loaded so that a saved collapsed
  // state is applied before the uncontrolled expansion state initializes.
  if (!isPreferenceLoaded) {
    return null;
  }

  return (
    <PageSection className="pf-v6-u-pt-0">
      <MultiContentCard
        key={String(isGettingStartedSectionOpen)}
        className="kn-functions-getting-started-section"
        isExpandable
        withDividers
        variant="secondary"
        data-test="getting-started"
        defaultExpanded={isGettingStartedSectionOpen}
        onExpand={() => setIsGettingStartedSectionOpen(!isGettingStartedSectionOpen)}
        toggleContent={
          <CardTitle data-test="title">
            <Content component={ContentVariants.h4}>{t('Get started with functions')}</Content>
            <Content component={ContentVariants.small}>
              {t('Choose how to create a function from below methods')}
            </Content>
          </CardTitle>
        }
        cards={[
          <SampleGettingStartedCard key="samples" />,
          <QuickStartGettingStartedCard
            key="quick-start"
            featured={['serverless-functions-using-cli', 'serverless-functions-using-ide']}
            title={t('Create function with guided documentation')}
            description={t('Follow guided documentation to create serverless functions.')}
          />,
          <FunctionsDocsGettingStartedCard key="docs" />,
        ]}
      />
    </PageSection>
  );
};
