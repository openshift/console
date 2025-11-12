import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils/horizontal-nav';
import { Kebab } from '@console/internal/components/utils/kebab';
import { OAuthModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { OAuthConfigDetails } from './OAuthConfigDetails';

const { common } = Kebab.factory;
const menuActions = [...common];
const oAuthReference = referenceForModel(OAuthModel);

const OAuthConfigDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => (
  <DetailsPage
    {...props}
    kind={oAuthReference}
    menuActions={menuActions}
    pages={[navFactory.details(OAuthConfigDetails), navFactory.editYaml()]}
  />
);

export default OAuthConfigDetailsPage;
