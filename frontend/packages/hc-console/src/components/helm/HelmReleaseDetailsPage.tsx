import * as React from 'react';
import { match as RMatch } from 'react-router';
import { Firehose, history } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { SecretModel } from '@console/internal/models';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import HelmReleaseDetails from './details/HelmReleaseDetails';

interface HelmReleaseDetailsPageProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
}

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push('/helm-releases/all-namespaces');
  } else {
    history.push('/helm-releases/ns/:ns');
  }
};

const HelmReleaseDetailsPage: React.FC<HelmReleaseDetailsPageProps> = ({ match }) => {
  const namespace = match.params.ns;
  const helmReleaseName = match.params.name;
  return (
    <NamespacedPage
      variant={NamespacedPageVariants.light}
      hideApplications
      onNamespaceChange={handleNamespaceChange}
    >
      <Firehose
        resources={[
          {
            namespace,
            kind: SecretModel.kind,
            prop: SecretModel.id,
            isList: true,
            selector: { name: `${helmReleaseName}` },
          },
        ]}
      >
        <HelmReleaseDetails match={match} />
      </Firehose>
    </NamespacedPage>
  );
};

export default HelmReleaseDetailsPage;
