import { Button, ButtonProps } from '@patternfly/react-core';
import type { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import { useTranslation } from 'react-i18next';

export type ExternalLinkButtonProps = ButtonProps & {
  iconProps?: SVGIconProps;
};

/**
 * A PatternFly Button that opens an external link in a new tab.
 */
export const ExternalLinkButton = ({ iconProps, ...props }: ExternalLinkButtonProps) => {
  const { t } = useTranslation('console-shared');

  return (
    <Button
      target="_blank"
      rel="noopener noreferrer"
      component="a"
      iconPosition="right"
      icon={<ExternalLinkAltIcon title={t('(Opens in new tab)')} {...iconProps} />}
      {...props}
    />
  );
};
