import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  GettingStartedGrid,
  useGettingStartedShowState,
  GettingStartedShowState,
  QuickStartGettingStartedCard,
} from '@console/shared/src/components/getting-started';
import { KUBEVIRT_QUICK_START_USER_SETTINGS_KEY } from './const';
import { FeatureHighlightsCard } from './FeatureHighlightsCard';
import { RecommendedOperatorsCard } from './RecommendedOperatorsCard';

import './getting-started-container-card.scss';

export const GettingStartedContainerCard: React.FC = () => {
  const { t } = useTranslation();
  const [showState, setShowState, showStateLoaded] = useGettingStartedShowState(
    KUBEVIRT_QUICK_START_USER_SETTINGS_KEY,
  );

  const showQuickStart = showStateLoaded && showState === GettingStartedShowState.SHOW;

  return (
    showQuickStart && (
      <div className="kv-overview-getting-started-section">
        <GettingStartedGrid onHide={() => setShowState(GettingStartedShowState.HIDE)}>
          <QuickStartGettingStartedCard
            featured={['explore-pipelines']}
            title={t('kubevirt-plugin~Quick Starts')}
            description={t(
              'kubevirt-plugin~Learn how to create, import, and run virtual machines on OpenShift with step-by-step instructions and tasks.',
            )}
            filter={(qs) => ['explore-pipelines'].includes(qs.metadata.name)}
          />
          <FeatureHighlightsCard />
          <RecommendedOperatorsCard />
        </GettingStartedGrid>
      </div>
    )
  );
};
