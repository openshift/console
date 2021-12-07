import * as React from 'react';
import classnames from 'classnames';
import { ListPageHeaderProps } from '@console/dynamic-plugin-sdk';

import { PageHeading } from '../../utils';

const ListPageHeader: React.FC<ListPageHeaderProps> = ({ helpText, title, children, badge }) => (
  <>
    {/* Badge rendered from PageHeading only when title is present */}
    <PageHeading title={title} badge={title ? badge : null} className="co-m-nav-title--row">
      <div className={classnames({ 'co-m-pane__createLink--no-title': !title })}>{children}</div>
      {!title && badge && <div>{badge}</div>}
    </PageHeading>
    {helpText && <p className="co-m-pane__help-text co-help-text">{helpText}</p>}
  </>
);

export default ListPageHeader;
