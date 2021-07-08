import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PrometheusHealthPopupProps } from '@console/plugin-sdk';
import {
  HealthState,
  healthStateMapping,
  healthStateMessage,
} from '@console/shared/src/components/dashboard/status-card/states';
import Status, {
  StatusPopupSection,
} from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import { getControlPlaneComponentHealth } from './status';

const ControlPlanePopup: React.FC<PrometheusHealthPopupProps> = ({ responses }) => {
  const { t } = useTranslation();
  const titles = [
    t('console-app~API Servers'),
    t('console-app~Controller Managers'),
    t('console-app~Schedulers'),
    t('console-app~API Request Success Rate'),
  ];

  return (
    <>
      {t(
        'console-app~Components of the Control Plane are responsible for maintaining and reconciling the state of the cluster.',
      )}
      <StatusPopupSection
        firstColumn={t('console-app~Components')}
        secondColumn={t('console-app~Response rate')}
      >
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
    </>
  );
};

export default ControlPlanePopup;
