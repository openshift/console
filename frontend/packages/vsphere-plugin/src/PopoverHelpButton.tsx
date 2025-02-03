import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { useTranslation } from 'react-i18next';

export const PopoverHelpButton: React.FC<{ content: React.ReactNode }> = ({ content }) => {
  const { t } = useTranslation('vsphere-plugin');
  return (
    <Popover aria-label={t('Help')} bodyContent={content}>
      <Button
        icon={<OutlinedQuestionCircleIcon className="co-field-level-help__icon" />}
        aria-label={t('Help')}
        variant="link"
        isInline
        className="co-field-level-help"
      />
    </Popover>
  );
};
