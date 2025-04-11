import * as React from 'react';
import classNames from 'classnames';
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
    hideFavoriteButton={hideFavoriteButton}
    helpText={helpText}
    primaryAction={
      children && (
        <div
          className={classNames('co-operator-details__actions', {
            'co-m-pane__createLink--no-title': !title,
          })}
        >
          {children}
        </div>
      )
    }
  />
);

export default ListPageHeader;
