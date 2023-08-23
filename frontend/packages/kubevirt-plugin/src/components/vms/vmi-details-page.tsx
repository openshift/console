import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { DetailsPage } from '@console/internal/components/factory';
import { navFactory } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { referenceFor } from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import {
  VM_DETAIL_CONSOLES_HREF,
  VM_DETAIL_DETAILS_HREF,
  VM_DETAIL_DISKS_HREF,
  VM_DETAIL_NETWORKS_HREF,
} from '../../constants';
import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getResource } from '../../utils';
import VMIDetailsPageInfoMessage from '../info-messages/VMIDetailsPageInfoMessage';
import { VMDisksAndFileSystemsPage } from '../vm-disks/vm-disks';
import { VMNics } from '../vm-nics';
import VMConsoleDetailsPage from './vm-console/VMConsoleDetailsPage';
import { VMDashboard } from './vm-dashboard';
import { VMDetailsFirehose } from './vm-details';
import { breadcrumbsForVMPage } from './vm-details-page';
import { VMEvents } from './vm-events';

export const VirtualMachinesInstanceDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const { name, ns: namespace } = params;

  const overviewPage = {
    href: '', // default landing page
    // t('kubevirt-plugin~Overview')
    nameKey: 'kubevirt-plugin~Overview',
    component: VMDashboard,
  };

  const detailsPage = {
    href: VM_DETAIL_DETAILS_HREF,
    // t('kubevirt-plugin~Details')
    nameKey: 'kubevirt-plugin~Details',
    component: VMDetailsFirehose,
  };

  const consolePage = {
    href: VM_DETAIL_CONSOLES_HREF,
    // t('kubevirt-plugin~Console')
    nameKey: 'kubevirt-plugin~Console',
    component: VMConsoleDetailsPage,
  };

  const nicsPage = {
    href: VM_DETAIL_NETWORKS_HREF,
    // t('kubevirt-plugin~Network Interfaces')
    nameKey: 'kubevirt-plugin~Network Interfaces',
    component: VMNics,
  };

  const disksPage = {
    href: VM_DETAIL_DISKS_HREF,
    // t('kubevirt-plugin~Disks')
    nameKey: 'kubevirt-plugin~Disks',
    component: VMDisksAndFileSystemsPage,
  };

  const pages = [
    overviewPage,
    detailsPage,
    navFactory.editYaml(),
    consolePage,
    navFactory.events(VMEvents),
    nicsPage,
    disksPage,
  ];

  const resources = [
    getResource(VirtualMachineModel, {
      name,
      namespace,
      isList: false,
      prop: 'vm',
      optional: true,
    }),
    getResource(PodModel, { namespace, prop: 'pods' }),
    getResource(VirtualMachineInstanceMigrationModel, { namespace, prop: 'migrations' }),
  ];

  return (
    <DetailsPage
      name={name}
      namespace={namespace}
      kind={kubevirtReferenceForModel(VirtualMachineInstanceModel)}
      kindObj={VirtualMachineInstanceModel}
      customActionMenu={(kindObj, obj) => {
        const objReference = referenceFor(obj);
        const context = { [objReference]: obj };
        return <LazyActionMenu variant={ActionMenuVariant.DROPDOWN} context={context} />;
      }}
      pages={pages}
      resources={resources}
      breadcrumbsFor={breadcrumbsForVMPage(t, location, params)}
      customData={{ kindObj: VirtualMachineInstanceModel }}
    >
      <VMIDetailsPageInfoMessage name={name} namespace={namespace} />
    </DetailsPage>
  );
};
