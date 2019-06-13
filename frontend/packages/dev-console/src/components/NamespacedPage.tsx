import * as React from 'react';
import { NamespaceBar } from '@console/internal/components/namespace';
import ApplicationSelector from './dropdown/ApplicationSelector';

import './NamespacedPage.scss';

const NamespacedPage: React.FC = ({ children }) => (
  <div className="odc-namespaced-page">
    <NamespaceBar>
      <ApplicationSelector />
    </NamespaceBar>
    <div className="odc-namespaced-page__content">{children}</div>
  </div>
);

export default NamespacedPage;
