import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@patternfly/react-core';

import { useGettingStartedShowState, GettingStartedShowState } from './useGettingStartedShowState';

interface RestoreGettingStartedButtonProps {
  userSettingsKey: string;
}

export const RestoreGettingStartedButton: React.FC<RestoreGettingStartedButtonProps> = ({
  userSettingsKey,
}) => {
  const { t } = useTranslation();
  const [showState, setShowState, showStateLoaded] = useGettingStartedShowState(userSettingsKey);

  if (!showStateLoaded || showState !== GettingStartedShowState.HIDE) {
    return null;
  }

  return (
    <Label
      color="purple"
      onClick={() => {
        setShowState(GettingStartedShowState.SHOW);
      }}
      onClose={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setShowState(GettingStartedShowState.DISAPPEAR);
      }}
      style={{ cursor: 'pointer' }}
      data-test="restore-getting-started"
    >
      {t('console-shared~Show getting started resources')}
    </Label>
  );
};
