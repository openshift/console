import * as React from 'react';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKindReference } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionModel } from '../..';
import { NetworkAttachmentDefinitionDetails } from './NetworkAttachmentDefinitionDetails';

const { common } = Kebab.factory;
const menuActions = [
  ...Kebab.getExtensionsActionsForKind(NetworkAttachmentDefinitionModel),
  ...common,
];

export const NetworkAttachmentDefinitionsDetailsPage: React.FC<NetworkAttachmentDefinitionsDetailPageProps> = (
  props,
) => {
  const overviewPage = {
    href: '', // default landing page
    // t('kubevirt-plugin~Details')
    nameKey: 'kubevirt-plugin~Details',
    component: NetworkAttachmentDefinitionDetails,
  };

  const pages = [overviewPage, navFactory.editYaml()];

  return (
    <DetailsPage
      {...props}
      pages={pages}
      kind={referenceForModel(NetworkAttachmentDefinitionModel)}
      menuActions={menuActions}
    />
  );
};

type NetworkAttachmentDefinitionsDetailPageProps = {
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
};

export default NetworkAttachmentDefinitionsDetailsPage;
