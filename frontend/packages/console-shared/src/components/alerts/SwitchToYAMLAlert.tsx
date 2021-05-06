import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';

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
    />
  );
};

export default SwitchToYAMLAlert;
