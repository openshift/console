import type { FC } from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const SwitchToYAMLAlert: FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  return (
    <Alert
      actionClose={onClose && <AlertActionCloseButton onClose={onClose} />}
      isInline
      title={t(
        'console-shared~Some fields might not be displayed in this form. Select YAML view to edit all fields.',
      )}
      variant="info"
      data-test="info-alert"
    />
  );
};

export default SwitchToYAMLAlert;
