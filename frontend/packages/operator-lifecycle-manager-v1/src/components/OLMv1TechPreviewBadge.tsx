import type { FC } from 'react';
import { Button, Label, Popover } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { useTranslation } from 'react-i18next';

/**
 * Shared tech preview badge with info popover for OLMv1 features.
 * Displays a yellow outline label with "Tech Preview" and an info icon that shows
 * a popover with details about OLMv1 when clicked.
 * Renders inline for use in tabs or toolbars.
 */
export const OLMv1TechPreviewBadge: FC = () => {
  const { t } = useTranslation();

  const popoverContent = (
    <div>
      {t(
        'olm-v1~Lets you use OLMv1 (Tech Preview), a streamlined redesign of OLMv0. OLMv1 simplifies operator management with declarative APIs, enhanced security, and direct, GitOps-friendly control over upgrades.',
      )}
    </div>
  );

  return (
    <>
      <Label color="yellow" isCompact variant="outline">
        {t('olm-v1~Tech Preview')}
      </Label>{' '}
      <Popover aria-label={t('olm-v1~OLMv1 information')} bodyContent={popoverContent}>
        <Button
          icon={<OutlinedQuestionCircleIcon />}
          aria-label={t('olm-v1~OLMv1 information')}
          variant="link"
          isInline
        />
      </Popover>
    </>
  );
};
