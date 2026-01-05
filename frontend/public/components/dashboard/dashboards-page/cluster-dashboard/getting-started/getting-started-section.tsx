import type { FC } from 'react';

import { FLAGS } from '@console/shared/src/constants/common';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  GettingStartedExpandableGrid,
  GettingStartedShowState,
  QuickStartGettingStartedCard,
  useGettingStartedShowState,
} from '@console/shared/src/components/getting-started';

import { ClusterSetupGettingStartedCard } from './cluster-setup-getting-started-card';
import { ExploreAdminFeaturesGettingStartedCard } from './explore-admin-features-getting-started-card';

import './getting-started-section.scss';

type GettingStartedSectionProps = {
  userSettingKey: string;
};

export const GettingStartedSection: FC<GettingStartedSectionProps> = ({ userSettingKey }) => {
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);

  const [showState, setShowState, showStateLoaded] = useGettingStartedShowState(userSettingKey);

  const [isGettingStartedSectionOpen, setIsGettingStartedSectionOpen] = useUserSettings<boolean>(
    `${userSettingKey}.expanded`,
    true,
  );

  if (!openshiftFlag || !showStateLoaded || showState !== GettingStartedShowState.SHOW) {
    return null;
  }

  return (
    <div className="co-dashboard-getting-started-section">
      <GettingStartedExpandableGrid
        isOpen={isGettingStartedSectionOpen}
        setIsOpen={setIsGettingStartedSectionOpen}
        setShowState={setShowState}
      >
        <ClusterSetupGettingStartedCard />
        <QuickStartGettingStartedCard
          featured={[
            // All part of the console-operator:
            // - Enable the Developer perspective
            'enable-developer-perspective',
            // - Impersonate a user
            'user-impersonation',
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
