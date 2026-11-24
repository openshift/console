import type { FC } from 'react';
import type { ExternalLinkButtonProps } from '@patternfly/react-component-groups';
import { ExternalLinkButton as PfExternalLinkButton } from '@patternfly/react-component-groups';
import { useTranslation } from 'react-i18next';

export type { ExternalLinkButtonProps } from '@patternfly/react-component-groups';

/**
 * A PatternFly Button that opens an external link in a new tab.
 */
export const ExternalLinkButton: FC<ExternalLinkButtonProps> = ({ iconProps, ...props }) => {
  const { t } = useTranslation('console-shared');

  return (
    <PfExternalLinkButton
      iconProps={{ ...(iconProps || {}), title: t('(Opens in new tab)') }}
      {...props}
    />
  );
};
