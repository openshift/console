import * as React from 'react';
import { NavigateFunction } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import HelmReleaseDetails from './HelmReleaseDetails';

const handleNamespaceChange = (newNamespace: string, navigate: NavigateFunction): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    navigate('/helm-releases/all-namespaces');
  } else {
    navigate('/helm-releases/ns/:ns');
  }
};

const HelmReleaseDetailsPage: React.FC = () => {
  return (
    <NamespacedPage
      variant={NamespacedPageVariants.light}
      hideApplications
      onNamespaceChange={handleNamespaceChange}
    >
      <HelmReleaseDetails />
    </NamespacedPage>
  );
};

export default HelmReleaseDetailsPage;
