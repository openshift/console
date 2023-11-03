import * as React from 'react';

import { FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  GettingStartedGrid,
  useGettingStartedShowState,
  GettingStartedShowState,
  QuickStartGettingStartedCard,
} from '@console/shared/src/components/getting-started';

import { USER_SETTINGS_KEY } from './constants';
import { ClusterSetupGettingStartedCard } from './cluster-setup-getting-started-card';
import { ExploreAdminFeaturesGettingStartedCard } from './explore-admin-features-getting-started-card';

import './getting-started-section.scss';

export const GettingStartedSection: React.FC = () => {
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);
  const [showState, setShowState, showStateLoaded] = useGettingStartedShowState(USER_SETTINGS_KEY);

  if (!openshiftFlag || !showStateLoaded || showState !== GettingStartedShowState.SHOW) {
    return null;
  }

  return (
    <div className="co-dashboard-getting-started-section">
      <GettingStartedGrid onHide={() => setShowState(GettingStartedShowState.HIDE)}>
        <ClusterSetupGettingStartedCard />
        <QuickStartGettingStartedCard
          featured={[
            // All part of the console-operator:
            // - Monitor your sample application
            'monitor-sampleapp',
            // - Install the Red Hat Developer Hub (RHDH) operator (and create a RHDH instance)
            'rhdh-installation-via-operator',
            // - Install the Red Hat OpenShift Pipelines operator
            'explore-pipelines',
            // - Install the Red Hat OpenShift Serverless operator
            'install-serverless',
          ]}
        />
        <ExploreAdminFeaturesGettingStartedCard />
      </GettingStartedGrid>
    </div>
  );
};
