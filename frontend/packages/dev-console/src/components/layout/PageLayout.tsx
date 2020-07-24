import * as React from 'react';
import { Text } from '@patternfly/react-core';

import './PageLayout.scss';

type PageLayoutProps = {
  children: React.ReactNode;
  title: React.ReactNode;
  hint?: React.ReactNode;
};

const PageLayout: React.FC<PageLayoutProps> = ({ children, title, hint }) => (
  <>
    <div className="ocs-page-layout__header">
      <Text component="h1" className="ocs-page-layout__title">
        {title}
      </Text>
      {hint && <div className="ocs-page-layout__hint">{hint}</div>}
    </div>
    <div className="ocs-page-layout__content">{children}</div>
  </>
);

export default PageLayout;
