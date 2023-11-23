import * as React from 'react';
import { Card, CardBody, ExpandableSection } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useUserSettings } from '@console/shared';
import { FUNCTIONS_GETTING_STARTED_SECTION_USER_SETTING_KEY } from '../../const';
import { FunctionsDocsGettingStartedCard } from './FunctionsDocsGettingStartedCard';
import { QuickStartGettingStartedCard } from './QuickStartGettingStartedCard';
import { SampleGettingStartedCard } from './SamplesGettingStartedCard';

import './GettingStartedSection.scss';

export const GettingStartedSection: React.FC = () => {
  const { t } = useTranslation();

  const [isGettingStartedSectionOpen, setIsGettingStartedSectionOpen] = useUserSettings<boolean>(
    FUNCTIONS_GETTING_STARTED_SECTION_USER_SETTING_KEY,
    true,
  );

  return (
    <div className="odc-functions-getting-started-section">
      <ExpandableSection
        toggleText={t('knative-plugin~Get started with functions')}
        onToggle={() => setIsGettingStartedSectionOpen(!isGettingStartedSectionOpen)}
        isExpanded={isGettingStartedSectionOpen}
        displaySize="lg"
      >
        <Card className="odc-functions-getting-started-grid" data-test="getting-started">
          <span style={{ marginLeft: '16px' }}>
            {t('knative-plugin~Choose how to create a function from below methods')}
          </span>
          <CardBody className="odc-functions-getting-started-grid__content">
            <SampleGettingStartedCard />
            <QuickStartGettingStartedCard
              featured={['serverless-functions-using-cli', 'serverless-functions-using-ide']}
              title={t('knative-plugin~Create function with guided documentation')}
              description={t(
                'knative-plugin~Follow guided documentation to create serverless functions.',
              )}
            />
            <FunctionsDocsGettingStartedCard />
          </CardBody>
        </Card>
      </ExpandableSection>
    </div>
  );
};
