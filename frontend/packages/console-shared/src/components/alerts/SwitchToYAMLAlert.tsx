import * as React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const SwitchToYAMLAlert: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  return (
    <Alert
      actionClose={onClose && <AlertActionCloseButton onClose={onClose} />}
      isInline
      title={t(
        'console-shared~Note: Some fields may not be represented in this form view. Please select "YAML view" for full control.',
      )}
      variant="info"
      data-test="info-alert"
    />
  );
};

export default SwitchToYAMLAlert;
