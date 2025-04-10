import * as React from 'react';
import classNames from 'classnames';
import { ListPageHeaderProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { PageHeading } from '../../utils';

const ListPageHeader: React.FC<ListPageHeaderProps> = ({
  helpText,
  title,
  children,
  badge,
  hideFavoriteButton,
}) => (
  <>
    {/* Badge rendered from PageHeading only when title is present */}
    <PageHeading
      title={title}
      badge={title ? badge : null}
      navTitleAsRow
      hideFavoriteButton={hideFavoriteButton}
      helpText={helpText}
    >
      <div
        className={classNames('co-operator-details__actions', {
          'co-m-pane__createLink--no-title': !title,
        })}
      >
        {children}
      </div>
      {!title && badge && <div>{badge}</div>}
    </PageHeading>
  </>
);

export default ListPageHeader;
