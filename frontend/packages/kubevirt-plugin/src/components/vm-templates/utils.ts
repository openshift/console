import { history } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { VMWizardName } from '../../constants';
import { getWorkloadProfile } from '../../selectors/vm';
import { getTemplateName, isCommonTemplate } from '../../selectors/vm-template/basic';
import { isTemplateSourceError, TemplateSourceStatus } from '../../statuses/template/types';
import { TemplateItem } from '../../types/template';
import { getVMWizardCreateLink } from '../../utils/url';
import { sourceErrorModal, sourceNotReadyModal } from '../modals/vm-template-modals/source-modal';

const DEFAULT_OS_VARIANT = 'template.kubevirt.io/default-os-variant';

export const filterTemplates = (
  userTemplates: TemplateKind[],
  commonTemplates: TemplateKind[],
): TemplateItem[] => {
  const userTemplateItems: TemplateItem[] = userTemplates
    .filter((t) => !isCommonTemplate(t))
    .map((t) => ({
      metadata: {
        name: t.metadata.name,
        uid: t.metadata.uid,
        namespace: t.metadata.namespace,
      },
      isCommon: false,
      variants: [t],
    }));

  const commonTemplateItems = commonTemplates.reduce((acc, t) => {
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

export const createVMAction = (
  template: TemplateItem,
  sourceStatus: TemplateSourceStatus,
  namespace: string,
) => {
  if (isTemplateSourceError(sourceStatus)) {
    sourceErrorModal({ sourceStatus });
  } else if (!sourceStatus || sourceStatus.isReady) {
    history.push(
      getVMWizardCreateLink({
        wizardName: VMWizardName.BASIC,
        template: template.variants[0],
        namespace,
      }),
    );
  } else {
    sourceNotReadyModal({});
  }
};
