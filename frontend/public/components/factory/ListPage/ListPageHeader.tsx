import * as React from 'react';
import { ListPageHeaderProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { PageSection } from '@patternfly/react-core';

const ListPageHeader: React.FCC<ListPageHeaderProps> = ({
  helpText,
  title,
  children,
  badge,
  hideFavoriteButton,
  helpAlert,
}) =>
  title ? (
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
      {children}
      {badge && <div>{badge}</div>}
      {helpAlert}
    </PageSection>
  );

export default ListPageHeader;
