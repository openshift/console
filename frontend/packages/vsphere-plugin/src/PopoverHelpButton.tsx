import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

export const PopoverHelpButton: React.FC<{ content: React.ReactNode }> = ({ content }) => {
  const { t } = useTranslation();
  return (
    <Popover aria-label={t('vsphere-plugin~Help')} bodyContent={content}>
      <Button
        aria-label={t('vsphere-plugin~Help')}
        variant="link"
        isInline
        className="co-field-level-help"
      >
        <OutlinedQuestionCircleIcon className="co-field-level-help__icon" />
      </Button>
    </Popover>
  );
};
