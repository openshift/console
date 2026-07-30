import type { FC } from 'react';
import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useGettingStartedShowState, GettingStartedShowState } from './useGettingStartedShowState';

interface RestoreGettingStartedButtonProps {
  userPreferenceKey: string;
}

export const RestoreGettingStartedButton: FC<RestoreGettingStartedButtonProps> = ({
  userPreferenceKey,
}) => {
  const { t } = useTranslation('console-shared');
  const [showState, setShowState, showStateLoaded] = useGettingStartedShowState(userPreferenceKey);

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
      {t('Show getting started resources')}
    </Label>
  );
};
