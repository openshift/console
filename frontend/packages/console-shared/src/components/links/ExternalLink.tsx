import * as React from 'react';
import type { ButtonProps } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { ExternalLinkButton } from '@console/shared/src/components/links/ExternalLinkButton';

type ExternalLinkProps = ButtonProps & {
  href: string;
  text?: React.ReactNode;
  additionalClassName?: string;
  dataTestID?: string;
  stopPropagation?: boolean;
};

export const ExternalLink = ({
  children,
  href,
  text,
  additionalClassName = '',
  dataTestID,
  stopPropagation,
  ...props
}: ExternalLinkProps) => (
  <ExternalLinkButton
    className={css(additionalClassName, props?.className)}
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
