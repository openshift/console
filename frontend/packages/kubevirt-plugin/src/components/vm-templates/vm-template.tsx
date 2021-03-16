import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { match } from 'react-router';
import { ListPage, MultiListPage } from '@console/internal/components/factory';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { TemplateModel, PersistentVolumeClaimModel, PodModel } from '@console/internal/models';
import { TemplateKind } from '@console/internal/module/k8s';

import { getLoadedData } from '../../utils';
import {
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_VM,
  VM_CUSTOMIZE_LABEL,
  TEMPLATE_CUSTOMIZED_ANNOTATION,
} from '../../constants/vm';
import { DataVolumeModel, VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { getTemplateProviderType, templateProviders } from '../../selectors/vm-template/basic';
import { filterTemplates } from './utils';
import { CDI_APP_LABEL } from '../../constants';
import { VMKind } from '../../types';
import VMTemplateTable from './table/VMTemplateTable';
import { VirtualMachineTemplateBundle } from './table/types';

// TODO
const filters = (t: TFunction): RowFilter<VirtualMachineTemplateBundle>[] => [
  {
    filterGroupName: t('kubevirt-plugin~Provider'),
    type: 'template-provider',
    reducer: (obj) => (obj.template ? getTemplateProviderType(obj.template) : 'user'),
    items: templateProviders(t),
    filter: (types, obj: VirtualMachineTemplateBundle) => {
      if (obj.template) {
        const type = getTemplateProviderType(obj.template);
        return types.selected.size === 0 || types.selected.has(type);
      }
      return types.selected.size === 0 || types.selected.has('user');
    },
  },
];

const flatten = ({ vmTemplates, vmCommonTemplates, vms }): VirtualMachineTemplateBundle[] => {
  const user = getLoadedData<TemplateKind[]>(vmTemplates, []);
  const common = getLoadedData<TemplateKind[]>(vmCommonTemplates, []);
  return [
    ...getLoadedData<VMKind[]>(vms, []).map((vm) => {
      let template: TemplateKind;
      try {
        template = JSON.parse(vm.metadata.annotations[TEMPLATE_CUSTOMIZED_ANNOTATION]);
      } catch {
        return null;
      }
      return {
        customizeTemplate: {
          vm,
          template,
        },
        metadata: vm.metadata,
      };
    }),
    ...filterTemplates([...user, ...common]).map((template) => ({
      template,
      metadata: template.variants[0].metadata,
    })),
  ];
};

const VirtualMachineTemplatesPage: React.FC<VirtualMachineTemplatesPageProps &
  React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  const { skipAccessReview, noProjectsAvailable, showTitle } = props.customData;
  const namespace = props.match.params.ns;

  const resources = [
    {
      kind: TemplateModel.kind,
      isList: true,
      namespace,
      prop: 'vmTemplates',
      selector: {
        matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
      },
    },
    {
      kind: TemplateModel.kind,
      isList: true,
      namespace: 'openshift',
      prop: 'vmCommonTemplates',
      selector: {
        matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
      },
    },
    {
      kind: DataVolumeModel.kind,
      isList: true,
      namespace,
      prop: 'dataVolumes',
    },
    {
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace,
      prop: 'pvcs',
    },
    {
      kind: PodModel.kind,
      isList: true,
      namespace,
      selector: {
        matchLabels: { app: CDI_APP_LABEL },
      },
      prop: 'pods',
    },
    {
      kind: VirtualMachineModel.kind,
      selector: {
        matchLabels: { [VM_CUSTOMIZE_LABEL]: 'true' },
      },
      namespace,
      isList: true,
      prop: 'vms',
    },
    {
      kind: VirtualMachineInstanceModel.kind,
      namespace,
      isList: true,
      prop: 'vmis',
    },
  ];

  const createAccessReview = skipAccessReview ? null : { model: TemplateModel, namespace };
  const modifiedProps = Object.assign({}, { mock: noProjectsAvailable }, props);

  return (
    <MultiListPage
      {...modifiedProps}
      createAccessReview={createAccessReview}
      createButtonText={t('kubevirt-plugin~Create')}
      title={t('kubevirt-plugin~Virtual Machine Templates')}
      showTitle={showTitle}
      ListComponent={VMTemplateTable}
      resources={resources}
      flatten={flatten}
      label={t('kubevirt-plugin~Virtual Machine Templates')}
      rowFilters={filters(t)}
    />
  );
};

type VirtualMachineTemplatesPageProps = {
  match: match<{ ns?: string }>;
  customData: {
    showTitle?: boolean;
    skipAccessReview?: boolean;
    noProjectsAvailable?: boolean;
  };
};

export { VirtualMachineTemplatesPage };
