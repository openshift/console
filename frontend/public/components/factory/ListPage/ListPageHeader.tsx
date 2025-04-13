import * as React from 'react';
import { ListPageHeaderProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { PageHeading } from '../../utils';

const ListPageHeader: React.FCC<ListPageHeaderProps> = ({
  helpText,
  title,
  children,
  badge,
  hideFavoriteButton,
}) => (
  <PageHeading
    title={title}
    badge={badge}
    hideFavoriteButton={hideFavoriteButton ?? !title}
    helpText={helpText}
    primaryAction={title ? children : undefined}
  >
    {title ? undefined : children}
  </PageHeading>
);

export default ListPageHeader;
