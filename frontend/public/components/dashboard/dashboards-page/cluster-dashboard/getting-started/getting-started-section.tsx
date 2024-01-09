import * as React from 'react';

import {
  FLAGS,
  GETTING_STARTED_USER_SETTINGS_KEY_CLUSTER_DASHBOARD,
  useUserSettings,
} from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  GettingStartedExpandableGrid,
  QuickStartGettingStartedCard,
} from '@console/shared/src/components/getting-started';

import { ClusterSetupGettingStartedCard } from './cluster-setup-getting-started-card';
import { ExploreAdminFeaturesGettingStartedCard } from './explore-admin-features-getting-started-card';

import './getting-started-section.scss';

export const GettingStartedSection: React.FC = () => {
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);

  const [isGettingStartedSectionOpen, setIsGettingStartedSectionOpen] = useUserSettings<boolean>(
    GETTING_STARTED_USER_SETTINGS_KEY_CLUSTER_DASHBOARD,
    true,
  );

  if (!openshiftFlag) {
    return null;
  }

  return (
    <div className="co-dashboard-getting-started-section">
      <GettingStartedExpandableGrid
        isOpen={isGettingStartedSectionOpen}
        setIsOpen={setIsGettingStartedSectionOpen}
      >
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
      </GettingStartedExpandableGrid>
    </div>
  );
};
