import { useCallback } from 'react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import HelmReleaseDetails from './HelmReleaseDetails';

const HelmReleaseDetailsPage: FC = () => {
  const navigate = useNavigate();

  const handleNamespaceChange = useCallback(
    (newNamespace: string): void => {
      if (newNamespace === ALL_NAMESPACES_KEY) {
        navigate('/helm-releases/all-namespaces');
      } else {
        navigate(`/helm-releases/ns/${newNamespace}`);
      }
    },
    [navigate],
  );

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
