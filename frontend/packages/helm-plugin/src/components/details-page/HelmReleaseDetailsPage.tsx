import * as React from 'react';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { history } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import HelmReleaseDetails from './HelmReleaseDetails';

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push('/helm-releases/all-namespaces');
  } else {
    history.push('/helm-releases/ns/:ns');
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
