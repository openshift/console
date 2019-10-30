import * as React from 'react';
import { getResource } from '@console/kubevirt-plugin/src/utils';
import { DetailsPage } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { K8sResourceKindReference } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionModel } from '../..';
import { NetworkAttachmentDefinitionDetails } from './NetworkAttachmentDefinitionDetails';

const { common } = Kebab.factory;
const menuActions = [
  ...Kebab.getExtensionsActionsForKind(NetworkAttachmentDefinitionModel),
  ...common,
];

export const NetworkAttachmentDefinitionsDetailsPage: React.FC<
  NetworkAttachmentDefinitionsDetailPageProps
> = (props) => {
  const { name, namespace } = props;

  const resources = [
    getResource(NetworkAttachmentDefinitionModel, {
      name,
      namespace,
      isList: false,
      prop: 'netAttachDef',
      optional: true,
    }),
  ];

  const overviewPage = {
    href: '', // default landing page
    name: 'Overview',
    component: NetworkAttachmentDefinitionDetails,
  };

  const pages = [overviewPage, navFactory.editYaml()];

  return <DetailsPage {...props} pages={pages} resources={resources} menuActions={menuActions} />;
};

type NetworkAttachmentDefinitionsDetailPageProps = {
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
  match: any;
};

export default NetworkAttachmentDefinitionsDetailsPage;
