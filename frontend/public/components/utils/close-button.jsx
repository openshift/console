import * as React from 'react';
import { CloseIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

export const CloseButton = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button aria-label={t('public~Close')} className="close" onClick={onClick} type="button">
      <CloseIcon />
    </button>
  );
};
