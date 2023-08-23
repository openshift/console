import * as React from 'react';
import { FLAGS } from '@console/shared';
import {
  GettingStartedGrid,
  useGettingStartedShowState,
  GettingStartedShowState,
  QuickStartGettingStartedCard,
} from '@console/shared/src/components/getting-started';
import { useFlag } from '@console/shared/src/hooks/flag';
import { GETTING_STARTED_USER_SETTINGS_KEY } from './constants';
import { DeveloperFeaturesGettingStartedCard } from './DeveloperFeaturesGettingStartedCard';
import { SampleGettingStartedCard } from './SampleGettingStartedCard';

import './GettingStartedSection.scss';

export const GettingStartedSection: React.FC = () => {
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);
  const [showState, setShowState, showStateLoaded] = useGettingStartedShowState(
    GETTING_STARTED_USER_SETTINGS_KEY,
  );

  if (!openshiftFlag || !showStateLoaded || showState !== GettingStartedShowState.SHOW) {
    return null;
  }

  return (
    <div className="odc-add-page-getting-started-section">
      <GettingStartedGrid onHide={() => setShowState(GettingStartedShowState.HIDE)}>
        <SampleGettingStartedCard featured={['code-with-quarkus', 'java-springboot-basic']} />
        <QuickStartGettingStartedCard featured={['quarkus-with-s2i', 'spring-with-s2i']} />
        <DeveloperFeaturesGettingStartedCard />
      </GettingStartedGrid>
    </div>
  );
};
