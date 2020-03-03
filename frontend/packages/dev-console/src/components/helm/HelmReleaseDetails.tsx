import * as React from 'react';
import { match as RMatch } from 'react-router';
import { Firehose, history } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import { SecretModel } from '@console/internal/models';
import HelmReleaseDetailsPage from './HelmReleaseDetailsPage';

export const HELMRELEASES_ALL_NS_PAGE_URI = '/helm-releases/all-namespaces';
export interface HelmReleaseDetailsProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
}

const handleNamespaceChange = (newNamespace: string): void => {
  if (newNamespace === ALL_NAMESPACES_KEY) {
    history.push(HELMRELEASES_ALL_NS_PAGE_URI);
  } else {
    history.push('/helm-releases/ns/:ns');
  }
};

const HelmReleaseDetails: React.FC<HelmReleaseDetailsProps> = ({ match }) => {
  const namespace = match.params.ns;
  const helmReleaseName = match.params.name;
  return (
    <>
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
              prop: 'secret',
              isList: true,
              selector: { name: `${helmReleaseName}` },
            },
          ]}
        >
          <HelmReleaseDetailsPage match={match} />
        </Firehose>
      </NamespacedPage>
    </>
  );
};

export default HelmReleaseDetails;
