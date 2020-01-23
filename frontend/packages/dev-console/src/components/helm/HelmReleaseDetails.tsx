import * as React from 'react';
import { match as RMatch } from 'react-router';
import { Firehose } from '@console/internal/components/utils';
import { NamespaceBar } from '@console/internal/components/namespace';
import { SecretModel } from '@console/internal/models';
import HelmReleaseDetailsPage from './HelmReleaseDetailsPage';

export interface HelmReleaseDetailsProps {
  match: RMatch<{
    ns?: string;
    name?: string;
  }>;
}

const HelmReleaseDetails: React.FC<HelmReleaseDetailsProps> = ({ match }) => {
  const namespace = match.params.ns;
  const helmReleaseName = match.params.name;
  return (
    <>
      <NamespaceBar />
      <Firehose
        resources={[
          {
            kind: SecretModel.kind,
            namespace,
            isList: true,
            selector: { name: `${helmReleaseName}` },
            prop: 'secret',
          },
        ]}
      >
        <HelmReleaseDetailsPage match={match} />
      </Firehose>
    </>
  );
};

export default HelmReleaseDetails;
