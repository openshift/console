import * as React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '@patternfly/react-core';

import {
  CLUSTER_TELEMETRY_ANALYTICS,
  PREFERRED_TELEMETRY_USER_SETTING_KEY,
  USER_TELEMETRY_ANALYTICS,
  useUserSettings,
} from '@console/shared';

export const TelemetryNotifier = () => {
  const { t } = useTranslation();

  const [
    currentUserPreferenceTelemetryValue,
    setCurrentUserPreferenceTelemetryValue,
  ] = useUserSettings<USER_TELEMETRY_ANALYTICS>(PREFERRED_TELEMETRY_USER_SETTING_KEY, null, true);

  const userResponse = (value: USER_TELEMETRY_ANALYTICS) => {
    setCurrentUserPreferenceTelemetryValue(value);
  };

  return (
    <>
      {!currentUserPreferenceTelemetryValue &&
        (window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTIN ||
          window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTOUT) && (
          <div className="co-global-notifications" data-test="global-notifications">
            <div className="co-global-notification">
              <div className="co-global-telemetry-notification__content">
                <p className="co-global-notification__text">
                  <Trans t={t} ns="public">
                    Your feedback is valuable in enhancing our services. To help us improve, we seek
                    your consent to collect anonymized telemetry data.{' '}
                    <a
                      href="https://www.redhat.com/en/about/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy statement
                    </a>
                    .
                  </Trans>
                </p>
                <Button
                  variant="tertiary"
                  className="co-global-telemetry-notification__button"
                  onClick={() => userResponse(USER_TELEMETRY_ANALYTICS.ALLOW)}
                >
                  {t('public~Accept')}
                </Button>
                <Button
                  variant="tertiary"
                  className="co-global-telemetry-notification__button"
                  onClick={() => userResponse(USER_TELEMETRY_ANALYTICS.DENY)}
                >
                  {t('public~Deny')}
                </Button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};
