import * as React from 'react';
import { Content } from '@patternfly/react-core';
import cx from 'classnames';

import './PageLayout.scss';

type PageLayoutProps = {
  children: React.ReactNode;
  title: React.ReactNode;
  hint?: React.ReactNode;
  isDark?: boolean;
};

const PageLayout: React.FC<PageLayoutProps> = ({ children, title, hint, isDark }) => (
  <>
    <div className="ocs-page-layout__header">
      <Content component="h1" className="ocs-page-layout__title">
        {title}
      </Content>
      {hint && <div className="ocs-page-layout__hint">{hint}</div>}
    </div>
    <div className={cx('ocs-page-layout__content', { 'is-dark': isDark })}>{children}</div>
  </>
);

export default PageLayout;
