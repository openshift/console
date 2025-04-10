import * as React from 'react';
import { Content, ContentVariants, PageSection } from '@patternfly/react-core';

type PageLayoutProps = {
  children: React.ReactNode;
  title: React.ReactNode;
  hint?: React.ReactNode;
};

const PageLayout: React.FC<PageLayoutProps> = ({ children, title, hint }) => (
  <>
    <PageSection className="ocs-page-layout__header">
      <Content component={ContentVariants.h1} className="ocs-page-layout__title">
        {title}
      </Content>
      {hint && (
        <Content component={ContentVariants.p} className="ocs-page-layout__hint">
          {hint}
        </Content>
      )}
    </PageSection>
    <PageSection className="ocs-page-layout__content">{children}</PageSection>
  </>
);

export default PageLayout;
