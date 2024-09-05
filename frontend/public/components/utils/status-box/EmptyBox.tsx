import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MsgBox } from './MsgBox';

export const EmptyBox: React.FCC<EmptyBoxProps> = ({ label }) => {
  const { t } = useTranslation();
  return (
    <MsgBox dataTest="empty-box">
      {label ? t('public~No {{label}} found', { label }) : t('public~Not found')}
    </MsgBox>
  );
};
EmptyBox.displayName = 'EmptyBox';

type EmptyBoxProps = {
  label?: string;
};
