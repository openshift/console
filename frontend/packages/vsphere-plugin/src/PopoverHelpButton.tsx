import type { ReactNode, FC } from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

export const PopoverHelpButton: FC<{ content: ReactNode }> = ({ content }) => {
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
