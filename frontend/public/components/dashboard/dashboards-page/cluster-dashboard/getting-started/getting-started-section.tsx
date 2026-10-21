import type { FC } from 'react';
import { MultiContentCard } from '@patternfly/react-component-groups';
import { Button, CardTitle, Popover } from '@patternfly/react-core';
import { RhUiCloseIcon, RhUiQuestionMarkCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { QuickStartGettingStartedCard } from '@console/shared/src/components/getting-started/QuickStartGettingStartedCard';
import {
  GettingStartedShowState,
  useGettingStartedShowState,
} from '@console/shared/src/components/getting-started/useGettingStartedShowState';
import { FLAGS } from '@console/shared/src/constants/common';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { ClusterSetupGettingStartedCard } from './cluster-setup-getting-started-card';
import { ExploreAdminFeaturesGettingStartedCard } from './explore-admin-features-getting-started-card';

import './getting-started-section.scss';

type GettingStartedSectionProps = {
  userPreferenceKey: string;
};

export const GettingStartedSection: FC<GettingStartedSectionProps> = ({ userPreferenceKey }) => {
  const { t } = useTranslation('public');
  const openshiftFlag = useFlag(FLAGS.OPENSHIFT);

  const [showState, setShowState, showStateLoaded] = useGettingStartedShowState(userPreferenceKey);

  const [isGettingStartedSectionOpen, setIsGettingStartedSectionOpen] = useUserPreference<boolean>(
    `${userPreferenceKey}.expanded`,
    true,
  );

  if (!openshiftFlag || !showStateLoaded || showState !== GettingStartedShowState.SHOW) {
    return null;
  }

  return (
    <div className="co-dashboard-getting-started-section">
      <MultiContentCard
        isExpandable
        withDividers
        variant="secondary"
        data-test="getting-started"
        defaultExpanded={isGettingStartedSectionOpen}
        onExpand={() => setIsGettingStartedSectionOpen(!isGettingStartedSectionOpen)}
        toggleContent={
          <CardTitle data-test="title">
            {t('Getting started resources')}{' '}
            <Popover
              bodyContent={t(
                'Use our collection of resources to help you get started with the Console.',
              )}
              triggerAction="hover"
            >
              <Button
                variant="plain"
                hasNoPadding
                aria-label={t('More info')}
                icon={<RhUiQuestionMarkCircleIcon />}
              />
            </Popover>
          </CardTitle>
        }
        actions={
          <Button
            variant="plain"
            aria-label={t('Close')}
            icon={<RhUiCloseIcon />}
            onClick={() => setShowState(GettingStartedShowState.HIDE)}
          />
        }
        cards={[
          <ClusterSetupGettingStartedCard key="cluster-setup" />,
          <QuickStartGettingStartedCard
            key="quick-start"
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
          />,
          <ExploreAdminFeaturesGettingStartedCard key="admin-features" />,
        ]}
      />
    </div>
  );
};
