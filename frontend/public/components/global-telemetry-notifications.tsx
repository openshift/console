import { useTranslation, Trans } from 'react-i18next';
import { Banner, Button, Flex, PageSection } from '@patternfly/react-core';

import {
  CLUSTER_TELEMETRY_ANALYTICS,
  PREFERRED_TELEMETRY_USER_SETTING_KEY,
  USER_TELEMETRY_ANALYTICS,
  useUserSettings,
} from '@console/shared';
import { ExternalLink } from './utils';

export const TelemetryNotifier = () => {
  const { t } = useTranslation();

  const [
    currentUserPreferenceTelemetryValue,
    setCurrentUserPreferenceTelemetryValue,
  ] = useUserSettings<USER_TELEMETRY_ANALYTICS>(PREFERRED_TELEMETRY_USER_SETTING_KEY, null, true);

  const userResponse = (value: USER_TELEMETRY_ANALYTICS) => {
    setCurrentUserPreferenceTelemetryValue(value);
  };

  const showTelemetryNotification =
    !currentUserPreferenceTelemetryValue &&
    (window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTIN ||
      window.SERVER_FLAGS.telemetry?.STATE === CLUSTER_TELEMETRY_ANALYTICS.OPTOUT);

  return showTelemetryNotification ? (
    <PageSection
      hasBodyWrapper={false}
      padding={{ default: 'noPadding' }}
      className="pf-v6-c-page__main-section--no-gap"
      stickyOnBreakpoint={{ default: 'bottom' }}
      data-test="global-notifications"
    >
      <Banner>
        <Flex
          justifyContent={{ default: 'justifyContentCenter' }}
          gap={{ default: 'gapMd' }}
          alignItems={{ default: 'alignItemsCenter' }}
          flexWrap={{ default: 'wrap', sm: 'nowrap' }}
        >
          <p className="pf-v6-u-text-align-center">
            <Trans t={t} ns="public">
              Your feedback is valuable in enhancing our services. To help us improve, we seek your
              consent to collect anonymized telemetry data.{' '}
              <ExternalLink href="https://www.redhat.com/en/about/privacy-policy">
                Privacy statement
              </ExternalLink>
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
        </Flex>
      </Banner>
    </PageSection>
  ) : null;
};
