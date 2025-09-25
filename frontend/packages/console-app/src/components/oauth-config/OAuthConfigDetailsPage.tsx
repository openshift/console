import * as React from 'react';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { OAuthModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { useCommonResourceActions } from '../../actions/hooks/useCommonResourceActions';
import { OAuthConfigDetails } from './OAuthConfigDetails';

const oAuthReference = referenceForModel(OAuthModel);

const OAuthConfigDetailsPage: React.FC<React.ComponentProps<typeof DetailsPage>> = (props) => {
  const commonActions = useCommonResourceActions(OAuthModel, props.obj);
  const menuActions = [
    ...Kebab.getExtensionsActionsForKind(OAuthModel),
    ...commonActions,
  ] as Action[];
  return (
    <DetailsPage
      {...props}
      kind={oAuthReference}
      menuActions={menuActions}
      pages={[navFactory.details(OAuthConfigDetails), navFactory.editYaml()]}
    />
  );
};

export default OAuthConfigDetailsPage;
