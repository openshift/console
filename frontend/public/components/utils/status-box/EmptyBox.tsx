import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleEmptyState } from './ConsoleEmptyState';

export const EmptyBox: React.FCC<EmptyBoxProps> = ({ label }) => {
  const { t } = useTranslation();
  return (
    <ConsoleEmptyState dataTest="empty-box">
      {label ? t('public~No {{label}} found', { label }) : t('public~Not found')}
    </ConsoleEmptyState>
  );
};
EmptyBox.displayName = 'EmptyBox';

type EmptyBoxProps = {
  label?: string;
};
