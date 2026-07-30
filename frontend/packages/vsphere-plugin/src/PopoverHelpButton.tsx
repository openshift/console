import type { ReactNode, FC } from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { RhUiQuestionMarkCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

export const PopoverHelpButton: FC<{ content: ReactNode }> = ({ content }) => {
  const { t } = useTranslation('vsphere-plugin');
  return (
    <Popover aria-label={t('Help')} bodyContent={content}>
      <Button
        icon={<RhUiQuestionMarkCircleIcon className="co-field-level-help__icon" />}
        aria-label={t('Help')}
        variant="link"
        isInline
        className="co-field-level-help"
      />
    </Popover>
  );
};
