import * as React from 'react';
import { Content, ContentVariants } from '@patternfly/react-core';

const CatalogPageHelpText: React.FC = ({ children }) => {
  return (
    <Content component={ContentVariants.p} className="pf-v6-u-mt-sm co-help-text">
      {children}
    </Content>
  );
};

export default CatalogPageHelpText;
