import * as React from 'react';
import { HealthState, healthStateMapping } from '@console/shared/src/components/dashboard/status-card/states';
import { getControlPlaneComponentHealth } from './status';
import Status, { StatusPopupSection } from '@console/shared/src/components/dashboard/status-card/StatusPopup';
import { PrometheusHealthPopupProps } from '@console/plugin-sdk';
import { useTranslation } from 'react-i18next';

const ControlPlanePopup: React.FC<PrometheusHealthPopupProps> = ({ responses }) => {
  const { t } = useTranslation();
  const titles = [t('SINGLE:MSG_OVERVIEW_MAIN_POPOVERCONTROLPLANE_APISERVERS_1'), t('SINGLE:MSG_OVERVIEW_MAIN_POPOVERCONTROLPLANE_CONTROLLER_1'), t('SINGLE:MSG_OVERVIEW_MAIN_POPOVERCONTROLPLANE_SCHEDULERS_1'), t('SINGLE:MSG_OVERVIEW_MAIN_POPOVERCONTROLPLANE_APIREQUEST_1')];
  return (
    <>
      {t('SINGLE:MSG_OVERVIEW_MAIN_POPOVERCONTROLPLANE_DESCRIPTION_1')}
      <StatusPopupSection firstColumn={t('SINGLE:MSG_OVERVIEW_MAIN_POPOVERCONTROLPLANE_COMPONENTS_1')} secondColumn={t('SINGLE:MSG_OVERVIEW_MAIN_POPOVERCONTROLPLANE_RESPONCERATE_1')}>
        {responses.map(({ response, error }, index) => {
          const health = getControlPlaneComponentHealth(response, error);
          const icon = health.state === HealthState.LOADING ? <div className="skeleton-health" /> : healthStateMapping[health.state].icon;
          const value = health.message || healthStateMapping[health.state]?.message;
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
