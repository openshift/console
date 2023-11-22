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
        <QuickStartGettingStartedCard
          featured={[
            // Available when the Red Hat OpenShift Pipelines operator is installed:
            // - Deploying an application with a pipeline
            'install-app-and-associate-pipeline',

            // Available when the Red Hat OpenShift Serverless operator is installed:
            // - Exploring Serverless applications
            'serverless-application',

            // All part of the console-operator:
            // - Get started with Quarkus using s2i
            'quarkus-with-s2i',
            // - Get started with Spring
            'spring-with-s2i',
          ]}
        />
        <DeveloperFeaturesGettingStartedCard />
      </GettingStartedGrid>
    </div>
  );
};
