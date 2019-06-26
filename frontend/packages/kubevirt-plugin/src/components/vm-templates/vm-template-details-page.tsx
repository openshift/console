import * as React from 'react';

import { navFactory } from '@console/internal/components/utils';

import { DetailsPage } from '@console/internal/components/factory';
import { K8sResourceKindReference } from '@console/internal/module/k8s';

import { TemplateModel } from '@console/internal/models';
import { VMTemplateDetailsFirehose } from './vm-template-details';
import { VMDisksFirehose } from '../vm-disks';

export const VMTemplateDetailsPage = (props: VMTemplateDetailsPageProps) => {
  /* TODO(mlibra): pages will be transferred one by one in follow-ups
  const nicsPage = {
    href: 'nics',
    name: 'Network Interfaces',
    component: VmNic,
  };
  */

  const disksPage = {
    href: 'disks',
    name: 'Disks',
    component: VMDisksFirehose,
  };

  const pages = [
    navFactory.details(VMTemplateDetailsFirehose),
    navFactory.editYaml(),
    // nicsPage,
    disksPage,
  ];

  const menuActions = undefined; // TODO(mlibra): menuActions

  return (
    <DetailsPage
      {...props}
      kind={TemplateModel.kind}
      kindObj={TemplateModel}
      name={props.match.params.name}
      namespace={props.match.params.ns}
      menuActions={menuActions}
      pages={pages}
    />
  );
};

type VMTemplateDetailsPageProps = {
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
  match: any;
};
