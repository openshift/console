import type { FC } from 'react';
import { FLAGS, useUserSettings } from '@console/shared';
import {
  QuickStartGettingStartedCard,
  GettingStartedExpandableGrid,
  useGettingStartedShowState,
  GettingStartedShowState,
} from '@console/shared/src/components/getting-started';
import { useFlag } from '@console/shared/src/hooks/flag';
import { SampleGettingStartedCard } from './SampleGettingStartedCard';
import { DeveloperFeaturesGettingStartedCard } from './DeveloperFeaturesGettingStartedCard';

import '../../dashboards-page/cluster-dashboard/getting-started/getting-started-section.scss';

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
      </GettingStartedExpandableGrid>
    </div>
  );
};
