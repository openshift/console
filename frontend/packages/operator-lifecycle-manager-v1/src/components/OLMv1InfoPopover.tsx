import type { FC } from 'react';
import { Button, Content, ContentVariants, Popover } from '@patternfly/react-core';
import { RhUiQuestionMarkCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

/**
 * Shared info popover for OLMv1 features. Renders an info icon that shows a popover
 * with details about OLMv1 when clicked. Renders inline for use in tabs or toolbars.
 */
export const OLMv1InfoPopover: FC = () => {
  const { t } = useTranslation('olm-v1');

  const popoverContent = (
    <Content>
      <Content component={ContentVariants.p}>
        {t(
          'Operator Lifecycle Manager version 1 is a redesign of Operator Lifecycle Manager version 0. It simplifies Operator management with declarative APIs and gives you direct, GitOps-friendly control over upgrades. Operator Lifecycle Manager version 1 is a Technology Preview feature. For production clusters, continue to use classic Operators.',
        )}
      </Content>
    </Content>
  );

  return (
    <Popover
      aria-label={t('About Operator Lifecycle Manager version 1')}
      bodyContent={popoverContent}
    >
      <Button
        icon={<RhUiQuestionMarkCircleIcon aria-hidden="true" />}
        aria-label={t('About Operator Lifecycle Manager version 1')}
        variant="link"
        isInline
      />
    </Popover>
  );
};
