import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation, Location } from 'react-router-dom-v5-compat';
import { DetailsPage } from '@console/internal/components/factory/details';
import { isUpstream } from '@console/internal/components/utils';
import { navFactory } from '@console/internal/components/utils/horizontal-nav';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel, PodModel, TemplateModel } from '@console/internal/models';
import {
  K8sResourceKindReference,
  PersistentVolumeClaimKind,
  PodKind,
  TemplateKind,
} from '@console/internal/module/k8s/types';
import { KUBEVIRT_OS_IMAGES_NS, OPENSHIFT_OS_IMAGES_NS } from '../../constants';
import {
  VIRTUALMACHINES_BASE_URL,
  VIRTUALMACHINES_TEMPLATES_BASE_URL,
} from '../../constants/url-params';
import { useBaseImages } from '../../hooks/use-base-images';
import { useCustomizeSourceModal } from '../../hooks/use-customize-source-modal';
import { useSupportModal } from '../../hooks/use-support-modal';
import { DataSourceModel, DataVolumeModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { isCommonTemplate } from '../../selectors/vm-template/basic';
import { getTemplateSourceStatus } from '../../statuses/template/template-source-status';
import { DataSourceKind } from '../../types';
import { V1alpha1DataVolume } from '../../types/api';
import { VMDisks } from '../vm-disks/vm-disks';
import { VMNics } from '../vm-nics';
import { menuActionsCreator } from './menu-actions';
import { VMTemplateDetails } from './vm-template-details';

export const breadcrumbsForVMTemplatePage = (
  t: TFunction,
  location: Location,
  params: { [key: string]: string },
) => () => [
  {
    name: t('kubevirt-plugin~Virtualization'),
    path: `/k8s/ns/${params.ns || 'default'}/${VIRTUALMACHINES_BASE_URL}`,
  },
  {
    name: t('kubevirt-plugin~Templates'),
    path: `/k8s/ns/${params.ns || 'default'}/${VIRTUALMACHINES_TEMPLATES_BASE_URL}`,
  },
  {
    name: t('kubevirt-plugin~{{name}} Details', { name: params.name }),
    path: `${location}`,
  },
];

export const VMTemplateDetailsPage: React.FC<VMTemplateDetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const { name } = params;
  const namespace = params.ns;
  const [dataVolumes, dvLoaded, dvError] = useK8sWatchResource<V1alpha1DataVolume[]>({
    kind: kubevirtReferenceForModel(DataVolumeModel),
    isList: true,
    namespace,
  });
  const [pods, podsLoaded, podsError] = useK8sWatchResource<PodKind[]>({
    kind: PodModel.kind,
    isList: true,
    namespace,
  });
  const [pvcs, pvcsLoaded, pvcsError] = useK8sWatchResource<PersistentVolumeClaimKind[]>({
    kind: PersistentVolumeClaimModel.kind,
    isList: true,
    namespace,
  });
  const [dataSources, dataSourcesLoaded] = useK8sWatchResource<DataSourceKind[]>({
    namespace: isUpstream() ? KUBEVIRT_OS_IMAGES_NS : OPENSHIFT_OS_IMAGES_NS,
    kind: kubevirtReferenceForModel(DataSourceModel),
    isList: true,
  });
  const [template, templateLoaded, templateError] = useK8sWatchResource<TemplateKind>({
    kind: TemplateModel.kind,
    namespace,
    name,
  });
  const isCommon = isCommonTemplate(template);
  const [baseImages, imagesLoaded, error, baseImageDVs, baseImagePods] = useBaseImages(
    isCommon ? [template] : [],
    isCommon,
  );
  const sourceStatus =
    templateLoaded && !templateError
      ? getTemplateSourceStatus({
          template,
          pvcs: [...baseImages, ...pvcs],
          dataVolumes: [...dataVolumes, ...baseImageDVs],
          pods: [...pods, ...baseImagePods],
          dataSources,
        })
      : null;

  const withSupportModal = useSupportModal();
  const withCustomizeModal = useCustomizeSourceModal();
  const sourceLoaded =
    dvLoaded && podsLoaded && pvcsLoaded && templateLoaded && imagesLoaded && dataSourcesLoaded;
  const sourceLoadError = dvError || podsError || pvcsError || templateError || error;

  const nicsPage = {
    href: 'nics',
    // t('kubevirt-plugin~Network Interfaces')
    nameKey: 'kubevirt-plugin~Network Interfaces',
    component: VMNics,
  };

  const disksPage = {
    href: 'disks',
    // t('kubevirt-plugin~Disks')
    nameKey: 'kubevirt-plugin~Disks',
    component: VMDisks,
  };

  const pages = [navFactory.details(VMTemplateDetails), navFactory.editYaml(), nicsPage, disksPage];

  return (
    <DetailsPage
      {...props}
      kind={TemplateModel.kind}
      kindObj={TemplateModel}
      name={name}
      namespace={namespace}
      menuActions={menuActionsCreator}
      pages={pages}
      breadcrumbsFor={breadcrumbsForVMTemplatePage(t, location, params)}
      customData={{
        withSupportModal,
        sourceStatus,
        sourceLoaded,
        sourceLoadError,
        withCreate: true,
        withCustomizeModal,
        isCommonTemplate: isCommon,
        namespace,
      }}
    />
  );
};

type VMTemplateDetailsPageProps = {
  name: string;
  namespace: string;
  kind: K8sResourceKindReference;
};
