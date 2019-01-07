import React from 'react';
import { TEMPLATE_TYPE_LABEL } from 'kubevirt-web-ui-components';

import { DetailsPage } from '../factory/okdfactory';
import { breadcrumbsForOwnerRefs, navFactory, SectionHeading, ResourceSummary } from '../utils/okdutils';
import { menuActions } from './menu-actions';
import { kindForReference, LabelSelector } from '../../module/okdk8s';

const DetailsForKind = kind => function DetailsForKind_({obj}) {
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={`${kindForReference(kind)} Overview`} />
      <ResourceSummary resource={obj} podSelector="spec.podSelector" showNodeSelector={false} />
    </div>
  );
};

export const VirtualMachineTemplateDetailsPage = props => {
  const pages = [
    navFactory.details(DetailsForKind(props.kind)),
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
