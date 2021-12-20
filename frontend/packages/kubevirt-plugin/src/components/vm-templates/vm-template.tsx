import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { RowFilter } from '@console/dynamic-plugin-sdk';
import { ListPage, MultiListPage } from '@console/internal/components/factory';
import { PersistentVolumeClaimModel, PodModel, TemplateModel } from '@console/internal/models';
import { CDI_APP_LABEL, VMWizardName } from '../../constants';
import {
  customizeWizardBaseURLBuilder,
  VIRTUALMACHINES_TEMPLATES_BASE_URL,
} from '../../constants/url-params';
import {
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  VM_CUSTOMIZE_LABEL,
} from '../../constants/vm';
import {
  DataSourceModel,
  DataVolumeModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getTemplateProviderType, templateProviders } from '../../selectors/vm-template/basic';
import { VirtualMachineTemplateBundle } from './table/types';
import VMTemplateTable from './table/VMTemplateTable';
import { flattenTemplates } from './utils';
import './vm-template.scss';

// TODO
const filters = (t: TFunction): RowFilter<VirtualMachineTemplateBundle>[] => [
  {
    filterGroupName: t('kubevirt-plugin~Template Provider'),
    type: 'template-provider',
    reducer: (obj) => {
      if (obj.template) {
        const type = getTemplateProviderType(obj.template);
        return type;
      }
      return 'user';
    },
    items: templateProviders(t),
    filter: (types, obj) => {
      let providerFilter = true;
      if (types.selected?.length > 0) {
        if (templateProviders(t).length === types.selected.length) {
          providerFilter = true;
        } else if (obj.template) {
          const type = getTemplateProviderType(obj.template);
          providerFilter = types.selected.includes(type);
        } else {
          providerFilter = types.selected.includes('user');
        }
      }
      return providerFilter;
    },
  },
];

const VirtualMachineTemplatesPage: React.FC<VirtualMachineTemplatesPageProps &
  React.ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  const { skipAccessReview, noProjectsAvailable, showTitle } = props?.customData || {};
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
      kind: kubevirtReferenceForModel(DataVolumeModel),
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
      kind: kubevirtReferenceForModel(DataSourceModel),
      isList: true,
      prop: 'dataSources',
      optional: true,
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
      kind: kubevirtReferenceForModel(VirtualMachineModel),
      selector: {
        matchLabels: { [VM_CUSTOMIZE_LABEL]: 'true' },
      },
      namespace,
      isList: true,
      prop: 'vms',
    },
    {
      kind: kubevirtReferenceForModel(VirtualMachineInstanceModel),
      namespace,
      isList: true,
      prop: 'vmis',
    },
  ];

  const createAccessReview = skipAccessReview ? null : { model: TemplateModel, namespace };
  const modifiedProps = Object.assign({}, { mock: noProjectsAvailable }, props);

  const createProps = {
    items: {
      [VMWizardName.WIZARD]: t('kubevirt-plugin~With Wizard'),
      [VMWizardName.YAML]: t('kubevirt-plugin~With YAML'),
    },
    createLink: (itemName: string) => {
      const baseUrlWizard = customizeWizardBaseURLBuilder(namespace);
      const baseURLYaml = `/k8s/ns/${namespace || 'default'}/${VIRTUALMACHINES_TEMPLATES_BASE_URL}`;

      switch (itemName) {
        case VMWizardName.WIZARD:
          return `${baseUrlWizard}?mode=template`;
        case VMWizardName.YAML:
          return `${baseURLYaml}/~new?mode=template`;
        default:
          return `${baseUrlWizard}?mode=template`;
      }
    },
  };

  return (
    <div className="kv-template--list">
      <MultiListPage
        {...modifiedProps}
        createAccessReview={createAccessReview}
        createButtonText={t('kubevirt-plugin~Create')}
        createProps={createProps}
        canCreate
        title={t('kubevirt-plugin~Virtual Machine Templates')}
        showTitle={showTitle}
        ListComponent={VMTemplateTable}
        resources={resources}
        flatten={flattenTemplates}
        label={t('kubevirt-plugin~Virtual Machine Templates')}
        rowFilters={filters(t)}
      />
    </div>
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
