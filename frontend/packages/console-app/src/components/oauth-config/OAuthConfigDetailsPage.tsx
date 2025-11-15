import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils/horizontal-nav';
import { OAuthModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { OAuthConfigDetails } from './OAuthConfigDetails';

const oAuthReference = referenceForModel(OAuthModel);

const OAuthConfigDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => (
  <DetailsPage
    {...props}
    kind={oAuthReference}
    pages={[navFactory.details(OAuthConfigDetails), navFactory.editYaml()]}
  />
);

export default OAuthConfigDetailsPage;
