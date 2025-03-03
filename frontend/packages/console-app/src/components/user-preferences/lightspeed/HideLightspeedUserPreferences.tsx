import * as React from 'react';
import { Checkbox } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useUserSettings } from '@console/shared';

const PREFERRED_LIGHTSPEED_USER_SETTING_KEY = 'console.hideLightspeedButton';

const HideLightspeedUserPreferences: React.FC = () => {
  const { t } = useTranslation();
  const [hideLightspeed, setHideLightspeed, hideLightspeedLoaded] = useUserSettings<boolean>(
    PREFERRED_LIGHTSPEED_USER_SETTING_KEY,
    false,
    true,
  );

  if (!hideLightspeedLoaded) {
    return null;
  }

  return (
    <Checkbox
      id="hide-lightspeed"
      name="hide-lightspeed"
      label={t('console-app~Hide Lightspeed')}
      description={t('console-app~Do not display the Lightspeed button.')}
      isChecked={hideLightspeed}
      onChange={(_event, checked) => setHideLightspeed(checked)}
    />
  );
};

export default HideLightspeedUserPreferences;
