import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core';

export const EmptyBox: React.FCC<EmptyBoxProps> = ({ label }) => {
  const { t } = useTranslation();
  return (
    <EmptyState>
      <EmptyStateBody data-test="empty-box-body">
        {label ? t('public~No {{label}} found', { label }) : t('public~Not found')}
      </EmptyStateBody>
    </EmptyState>
  );
};
EmptyBox.displayName = 'EmptyBox';

type EmptyBoxProps = {
  label?: string;
};
