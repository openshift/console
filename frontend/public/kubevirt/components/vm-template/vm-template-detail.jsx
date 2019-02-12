import React from 'react';
import * as _ from 'lodash-es';
import { VmTemplateDetails, TEMPLATE_TYPE_LABEL, getNamespace, getResource } from 'kubevirt-web-ui-components';

import { DetailsPage } from '../factory/okdfactory';
import { breadcrumbsForOwnerRefs, navFactory, ResourceLink } from '../utils/okdutils';
import { menuActions } from './menu-actions';
import { k8sGet, k8sPatch, LabelSelector } from '../../module/okdk8s';
import { DataVolumeModel, NamespaceModel } from '../../models';
import { LoadingInline } from '../../../components/utils';
import { WithResources } from '../utils/withResources';


const VmTemplateDetails_ = ( { obj: vmTemplate, match }) => {

  const namespaceResourceLink = () =>
    <ResourceLink kind={NamespaceModel.kind} name={getNamespace(vmTemplate)} title={getNamespace(vmTemplate)} />;

  const resourceMap = {
    dataVolumes: {
      resource:  getResource(DataVolumeModel, {namespace: _.get(match, 'params.ns')}),
    },
  };

  return (
    <WithResources resourceMap={resourceMap}>
      <VmTemplateDetails
        vmTemplate={vmTemplate}
        NamespaceResourceLink={namespaceResourceLink}
        k8sPatch={k8sPatch}
        k8sGet={k8sGet}
        LoadingComponent={LoadingInline}
      />
    </WithResources>);
};

export const VirtualMachineTemplateDetailsPage = props => {
  const pages = [
    navFactory.details(VmTemplateDetails_),
    navFactory.editYaml(),
  ];

  const resolveBreadcrumbs = template => {
    let name = 'Template Details';

    const selector = new LabelSelector({
      matchLabels: {[TEMPLATE_TYPE_LABEL]: 'vm'},
    });

    if (selector.matches(template)){
      name = `Virtual Machine ${name}`;
    }

    return breadcrumbsForOwnerRefs(template).concat({
      name,
      path: props.match.url,
    });
  };

  return (
    <DetailsPage
      {...props}
      breadcrumbsFor={resolveBreadcrumbs}
      menuActions={menuActions}
      pages={pages}
    />);
};
