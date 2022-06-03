import * as React from 'react';
import classNames from 'classnames';

import './OverviewPage.scss';

export type OverviewPageProps = {
  className?: string;
  children: React.ReactNode;
};

export const OverviewPage: React.FC<OverviewPageProps> = ({ className, children }) => (
  <div data-test-id="dashboard" className={classNames('co-overview-page', className)}>
    {children}
  </div>
);
