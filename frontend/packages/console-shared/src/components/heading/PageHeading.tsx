import type { ReactNode } from 'react';
import type { PageHeaderLinkProps } from '@patternfly/react-component-groups';
import { PageHeader } from '@patternfly/react-component-groups';
import { ActionList, ActionListGroup, ActionListItem } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { FavoriteButton } from '@console/app/src/components/favorite/FavoriteButton';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { Breadcrumbs } from '@console/shared/src/components/breadcrumbs/Breadcrumbs';

import './PageHeading.scss';

interface PageHeadingLinkProps extends Omit<PageHeaderLinkProps, 'label'> {
  'data-test'?: string;
  /** Title for the link */
  label: ReactNode | string;
}

export type PageHeadingProps = {
  'data-test'?: string;
  /** A badge that is displayed next to the title of the heading */
  badge?: ReactNode;
  /** Breadcrumbs to be displayed above the title */
  breadcrumbs?: { name: string; path: string }[];
  /** A class name that is placed around the PageHeader wrapper */
  className?: string;
  /** An alert placed below the heading in the same PageSection. */
  helpAlert?: ReactNode;
  /** A subtitle placed below the title. */
  helpText?: ReactNode;
  /** An icon which is placed next to the title with a divider line */
  icon?: ReactNode;
  /**
   * The "Add to favourites" button is shown by default while in the admin perspective.
   * This prop allows you to hide the button. It should be hidden when `PageHeading`
   * is not the primary page header to avoid having multiple favourites buttons.
   */
  hideFavoriteButton?: boolean;
  /** A title for the page. */
  title?: string | JSX.Element;
  /** A primary action that is always rendered. */
  primaryAction?: ReactNode;
  /** Optional link below subtitle */
  linkProps?: PageHeadingLinkProps;
};

/**
 * A standard page heading component that is used in the console.
 */
export const PageHeading = ({
  'data-test': dataTest = 'page-heading',
  badge,
  breadcrumbs,
  className,
  helpAlert,
  helpText,
  icon,
  hideFavoriteButton,
  title,
  primaryAction,
  linkProps,
}: PageHeadingProps) => {
  const [perspective] = useActivePerspective();
  const isAdminPerspective = perspective === 'admin';
  const showFavoriteButton = isAdminPerspective && !hideFavoriteButton;

  return (
    <div data-test={dataTest} className={css('co-page-heading', className)}>
      <PageHeader
        breadcrumbs={breadcrumbs && <Breadcrumbs breadcrumbs={breadcrumbs} />}
        title={title}
        actionMenu={
          showFavoriteButton || primaryAction ? (
            <ActionList className="co-actions" data-test-id="details-actions">
              <ActionListGroup>
                {showFavoriteButton && (
                  <ActionListItem>
                    <FavoriteButton defaultName={typeof title === 'string' ? title : undefined} />
                  </ActionListItem>
                )}
                {primaryAction}
              </ActionListGroup>
            </ActionList>
          ) : null
        }
        icon={icon}
        label={badge}
        linkProps={linkProps}
        subtitle={helpText}
      >
        {helpAlert && helpAlert}
      </PageHeader>
    </div>
  );
};

PageHeading.displayName = 'PageHeading';
