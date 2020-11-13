import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { navFactory } from '@console/internal/components/utils';
import { DetailsPage } from '@console/internal/components/factory';
import { K8sResourceKindReference } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VMDisksFirehose } from '../vm-disks';
import { VMNics } from '../vm-nics';
import { menuActions } from './menu-actions';
import { VMTemplateDetailsConnected } from './vm-template-details';

export const breadcrumbsForVMTemplatePage = (t: TFunction, match: any) => () => [
  {
    name: t('kubevirt-plugin~Virtualization'),
    path: `/k8s/ns/${match.params.ns || 'default'}/virtualization`,
  },
  {
    name: t('kubevirt-plugin~Virtual Machines Templates'),
    path: `/k8s/ns/${match.params.ns || 'default'}/virtualization/templates`,
  },
  {
    name: t('kubevirt-plugin~{{name}} Details', { name: match.params.name }),
    path: `${match.url}`,
  },
];

export const VMTemplateDetailsPage: React.FC<VMTemplateDetailsPageProps> = (props) => {
  const { t } = useTranslation();

  const nicsPage = {
    href: 'nics',
    name: t('kubevirt-plugin~Network Interfaces'),
    component: VMNics,
  };

  const disksPage = {
    href: 'disks',
    name: t('kubevirt-plugin~Disks'),
    component: VMDisksFirehose,
  };

  const pages = [
    navFactory.details(VMTemplateDetailsConnected),
    navFactory.editYaml(),
    nicsPage,
    disksPage,
  ];

  return (
    <DetailsPage
      {...props}
      kind={TemplateModel.kind}
      kindObj={TemplateModel}
      name={props.match.params.name}
      namespace={props.match.params.ns}
      menuActions={menuActions}
      pages={pages}
      breadcrumbsFor={breadcrumbsForVMTemplatePage(t, props.match)}
    />
  );
};

type VMTemplateDetailsPageProps = {
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
  match: any;
};
