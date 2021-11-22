import { Flatten } from '@console/internal/components/factory';
import { history } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { TEMPLATE_CUSTOMIZED_ANNOTATION, VMWizardName } from '../../constants';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import {
  getTemplateName,
  isCommonTemplate,
  isDeprecatedTemplate,
} from '../../selectors/vm-template/basic';
import { getFlavorData } from '../../selectors/vm/flavor-data';
import { getFlavor, getWorkloadProfile } from '../../selectors/vm/selectors';
import { isTemplateSourceError, TemplateSourceStatus } from '../../statuses/template/types';
import { VMKind } from '../../types';
import { TemplateItem } from '../../types/template';
import { getLoadedData } from '../../utils';
import { getVMWizardCreateLink } from '../../utils/url';
import { sourceErrorModal, sourceNotReadyModal } from '../modals/vm-template-modals/source-modal';
import { VirtualMachineTemplateBundle } from './table/types';

const DEFAULT_OS_VARIANT = 'template.kubevirt.io/default-os-variant';

export const filterTemplates = (templates: TemplateKind[]): TemplateItem[] => {
  const userTemplateItems: TemplateItem[] = templates
    .filter((t) => !isCommonTemplate(t) && !isDeprecatedTemplate(t))
    .map((t) => ({
      metadata: {
        name: t.metadata.name,
        uid: t.metadata.uid,
        namespace: t.metadata.namespace,
      },
      isCommon: false,
      variants: [t],
    }));

  const commonTemplateItems = templates
    .filter((t) => isCommonTemplate(t) && !isDeprecatedTemplate(t))
    .reduce((acc, t) => {
      const name = getTemplateName(t);
      if (acc[name]) {
        const isRecommended = t.metadata.labels?.[DEFAULT_OS_VARIANT] === 'true';
        if (isRecommended) {
          acc[name].metadata = {
            name: t.metadata.name,
            uid: t.metadata.uid,
            namespace: t.metadata.namespace,
          };
          acc[name].variants.unshift(t);
        } else {
          acc[name].variants.push(t);
        }
      } else {
        acc[name] = {
          metadata: {
            name: t.metadata.name,
            uid: t.metadata.uid,
            namespace: t.metadata.namespace,
          },
          isCommon: true,
          variants: [t],
        };
      }
      return acc;
    }, {} as { [key: string]: TemplateItem });

  Object.keys(commonTemplateItems).forEach((key) => {
    const recommendedProfile = getWorkloadProfile(commonTemplateItems[key].variants[0]);
    commonTemplateItems[key].variants = commonTemplateItems[key].variants.filter(
      (t) => getWorkloadProfile(t) === recommendedProfile,
    );
  });

  return [...userTemplateItems, ...Object.values(commonTemplateItems)];
};

export const flattenTemplates: Flatten<
  { vmTemplates: TemplateKind[]; vmCommonTemplates: TemplateKind[]; vms: VMKind[] },
  VirtualMachineTemplateBundle[]
> = ({ vmTemplates, vmCommonTemplates, vms }) => {
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
  ].filter((template) => template);
};

export const createVMAction = (
  template: TemplateKind,
  sourceStatus: TemplateSourceStatus,
  namespace: string,
) => {
  if (isTemplateSourceError(sourceStatus)) {
    sourceErrorModal({ sourceStatus });
  } else if (!sourceStatus || sourceStatus.isReady) {
    history.push(
      getVMWizardCreateLink({
        wizardName: VMWizardName.BASIC,
        template,
        namespace,
      }),
    );
  } else {
    sourceNotReadyModal({});
  }
};

export const getVMTemplateResourceFlavorData = (template: TemplateKind, vmWrapper: VMWrapper) => {
  const flavorValues = {
    flavor: getFlavor(template),
    cpu: vmWrapper.getCPU(),
    memory: vmWrapper.getMemory(),
  };
  return getFlavorData(flavorValues);
};
