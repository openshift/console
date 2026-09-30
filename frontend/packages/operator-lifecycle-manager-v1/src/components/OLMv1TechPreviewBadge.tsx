import type { FC } from 'react';
import { Button, Label, Popover } from '@patternfly/react-core';
import { RhUiQuestionMarkCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

/**
 * Shared tech preview badge with info popover for OLMv1 features.
 * Displays a yellow outline label with "Tech Preview" and an info icon that shows
 * a popover with details about OLMv1 when clicked.
 * Renders inline for use in tabs or toolbars.
 */
export const OLMv1TechPreviewBadge: FC = () => {
  const { t } = useTranslation('olm-v1');

  const popoverContent = (
    <div>
      {t(
        'Use OLMv1, a Technology Preview redesign of Operator Lifecycle Manager. OLMv1 manages Operators through declarative APIs and lets you control upgrades directly, including through GitOps workflows.',
      )}
    </div>
  );

  return (
    <>
      <Label color="yellow" isCompact variant="outline">
        {t('Tech Preview')}
      </Label>{' '}
      <Popover aria-label={t('OLMv1 information')} bodyContent={popoverContent}>
        <Button
          icon={<RhUiQuestionMarkCircleIcon aria-hidden="true" />}
          aria-label={t('OLMv1 information')}
          variant="link"
          isInline
        />
      </Popover>
    </>
  );
};
