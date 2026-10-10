import type { FC } from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { RhUiQuestionMarkCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

/**
 * Shared info popover for OLMv1 features. Renders an info icon that shows a popover
 * with details about OLMv1 when clicked. Renders inline for use in tabs or toolbars.
 */
export const OLMv1InfoPopover: FC = () => {
  const { t } = useTranslation('olm-v1');

  const popoverContent = (
    <div>
      {t(
        'Lets you use Next-Gen (OLMv1), a streamlined redesign of Classic (OLMv0). OLMv1 simplifies operator management with declarative APIs, enhanced security, and direct, GitOps-friendly control over upgrades.',
      )}
    </div>
  );

  return (
    <Popover aria-label={t('OLMv1 information')} bodyContent={popoverContent}>
      <Button
        icon={<RhUiQuestionMarkCircleIcon aria-hidden="true" />}
        aria-label={t('OLMv1 information')}
        variant="link"
        isInline
      />
    </Popover>
  );
};
