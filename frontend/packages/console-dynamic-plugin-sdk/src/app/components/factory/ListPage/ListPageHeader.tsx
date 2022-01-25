import * as React from 'react';
import * as classNames from 'classnames';
import { ListPageHeaderProps } from '../../../../extensions/console-types';
import { PageHeading } from '../../utils/headings';

const ListPageHeader: React.FC<ListPageHeaderProps> = ({ helpText, title, children, badge }) => (
  <>
    {/* Badge rendered from PageHeading only when title is present */}
    <PageHeading title={title} badge={title ? badge : null} className="co-m-nav-title--row">
      <div className={classNames({ 'co-m-pane__createLink--no-title': !title })}>{children}</div>
      {!title && badge && <div>{badge}</div>}
    </PageHeading>
    {helpText && <p className="co-m-pane__help-text co-help-text">{helpText}</p>}
  </>
);

export default ListPageHeader;
