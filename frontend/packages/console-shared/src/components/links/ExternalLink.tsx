import type { ReactNode } from 'react';
import { css } from '@patternfly/react-styles';
import {
  ExternalLinkButton,
  ExternalLinkButtonProps,
} from '@console/shared/src/components/links/ExternalLinkButton';

type ExternalLinkProps = ExternalLinkButtonProps & {
  /** The URL to link to */
  href?: HTMLAnchorElement['href'];
  /** @deprecated Use `children` instead */
  text?: ReactNode;
  /** `data-test-id` */
  dataTestID?: string;
  /** Whether to stop the click event from propagating */
  stopPropagation?: boolean;
  /** Sets the display to block instead of inline without disabling PF's isInline */
  displayBlock?: boolean;
};

/**
 * `ExternalLink` is renders a link with that opens in a new tab with an
 * icon next to it. It should be used whenever you want a regular link that
 * opens in a new tab.
 *
 * This component overrides the default PatternFly `display` value. If that's
 * not what you want, use `ExternalLinkButton`.
 */
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
    className={css(
      // We specfically need to set display block instead setting isInline={false}
      // for word wrap to work. We don't want to unset isInline because unsetting
      // the prop adds extra margin and styling we don't want in an inline link.
      { 'pf-v6-u-display-block': displayBlock },
      // We also need to set display: inline instead of the default inline-flex
      // for word wrap to work correctly in ExternalLinkWithCopy
      { 'pf-v6-u-display-inline': !displayBlock },
      className,
    )}
    // Overriding the `display` breaks the icon spacing, so we need to add our own
    iconProps={{ className: 'pf-v6-u-ml-xs' }}
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
