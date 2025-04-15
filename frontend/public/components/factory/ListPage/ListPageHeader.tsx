import * as React from 'react';
import { ListPageHeaderProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { PageHeading } from '../../utils';
import { PageSection } from '@patternfly/react-core';

const ListPageHeader: React.FCC<ListPageHeaderProps> = ({
  helpText,
  title,
  children,
  badge,
  hideFavoriteButton,
}) =>
  title ? (
    <PageHeading
      title={title}
      badge={badge}
      hideFavoriteButton={hideFavoriteButton}
      helpText={helpText}
      primaryAction={children}
    />
  ) : (
    <PageSection hasBodyWrapper={false}>{children}</PageSection>
  );

export default ListPageHeader;
