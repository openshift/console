import type { FC } from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { PrometheusHealthPopupProps } from '@console/dynamic-plugin-sdk';
import {
  HealthState,
  healthStateMapping,
  healthStateMessage,
} from '@console/shared/src/components/dashboard/status-card/states';
import Status, {
  StatusPopupSection,
} from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import { getControlPlaneComponentHealth } from './status';

const ControlPlanePopup: FC<PrometheusHealthPopupProps> = ({ responses }) => {
  const { t } = useTranslation('console-app');
  const titles = [
    t('API Servers'),
    t('Controller Managers'),
    t('Schedulers'),
    t('API Request Success Rate'),
  ];

  return (
    <Stack hasGutter>
      <StackItem>
        {t(
          'console-app~Components of the control plane are responsible for maintaining and reconciling the state of the cluster.',
        )}
      </StackItem>
      <StackItem>
        <StatusPopupSection firstColumn={t('Components')} secondColumn={t('Response rate')}>
          {responses.map(({ response, error }, index) => {
            const health = getControlPlaneComponentHealth(response, error, t);
            const icon =
              health.state === HealthState.LOADING ? (
                <div className="skeleton-health" />
              ) : (
                healthStateMapping[health.state].icon
              );
            const value = health.message || healthStateMessage(health.state, t);
            return (
              <Status key={titles[index]} value={value} icon={icon}>
                {titles[index]}
              </Status>
            );
          })}
        </StatusPopupSection>
      </StackItem>
    </Stack>
  );
};

export default ControlPlanePopup;
