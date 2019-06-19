import * as React from 'react';
import { Helmet } from 'react-helmet';
import ODCEmptyState from './EmptyState';
import NamespacedPage from './NamespacedPage';

const AddPage: React.FC = () => (
  <React.Fragment>
    <Helmet>
      <title>+Add</title>
    </Helmet>
    <NamespacedPage>
      <ODCEmptyState title="+Add" />
    </NamespacedPage>
  </React.Fragment>
);

export default AddPage;
