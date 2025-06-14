import * as React from 'react';
import type { ButtonProps } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { ExternalLinkButton } from '@console/shared/src/components/links/ExternalLinkButton';

type ExternalLinkProps = ButtonProps & {
  href: string;
  text?: React.ReactNode;
  dataTestID?: string;
  stopPropagation?: boolean;
  displayBlock?: boolean;
};

export const ExternalLink = ({
  children,
  href,
  text,
  dataTestID,
  stopPropagation,
  displayBlock = false,
  className,
  ...props
}: ExternalLinkProps) => (
  <ExternalLinkButton
    className={css({ 'pf-v6-u-display-block': displayBlock }, className)}
    data-test-id={dataTestID}
    href={href}
    isInline
    variant="link"
    {...props}
    {...(stopPropagation ? { onClick: (e) => e.stopPropagation() } : {})}
  >
    {children || text}
  </ExternalLinkButton>
);
