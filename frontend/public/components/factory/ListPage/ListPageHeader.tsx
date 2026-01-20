import type { FC } from 'react';
import { ListPageHeaderProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { PageSection } from '@patternfly/react-core';

/**
 * `ListPageHeader` is a component that renders a header for a list page.
 *
 * It has the following behaviour:
 * - If a <title> is provided it renders a standard console `PageHeading`.
 * - If no <title> is provided, it renders a `PageSection` with the children, badge, helpAlert, and helpText.
 * - If no <title>, <children>, <badge>, <helpAlert>, or <helpText> are provided, it renders nothing.
 */
const ListPageHeader: FC<ListPageHeaderProps> = ({
  badge,
  children,
  helpAlert,
  helpText,
  hideFavoriteButton,
  title,
}) =>
  title || children || badge || helpAlert || helpText ? (
    title ? (
      // Render PageHeading if title is present
      <PageHeading
        title={title}
        badge={badge}
        hideFavoriteButton={hideFavoriteButton}
        helpText={helpText}
        primaryAction={children}
        helpAlert={helpAlert}
      />
    ) : (
      // Badge rendered from PageHeading only when title is present
      <PageSection hasBodyWrapper={false}>
        {children && <div>{children}</div>}
        {badge && <div>{badge}</div>}
        {helpText && <div>{helpText}</div>}
        {helpAlert && <div>{helpAlert}</div>}
      </PageSection>
    )
  ) : // Do not produce empty space if no title, children, badge, or help alert
  null;

export default ListPageHeader;
