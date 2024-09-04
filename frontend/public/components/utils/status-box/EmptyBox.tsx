import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from './Box';

export const EmptyBox: React.FC<EmptyBoxProps> = ({ label }) => {
  const { t } = useTranslation();
  return (
    <Box>
      <div data-test="empty-message" className="pf-v5-u-text-align-center">
        {label ? t('public~No {{label}} found', { label }) : t('public~Not found')}
      </div>
    </Box>
  );
};
EmptyBox.displayName = 'EmptyBox';

type EmptyBoxProps = {
  label?: string;
};
