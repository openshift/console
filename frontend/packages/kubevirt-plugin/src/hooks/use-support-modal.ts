import * as React from 'react';
import { isUpstream } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { createSupportModal } from '../components/modals/support-modal/support-modal';
import { TEMPLATE_WARN_SUPPORT } from '../constants';
import { getTemplateSupport, isCommonTemplate } from '../selectors/vm-template/basic';
import { useLocalStorage } from './use-local-storage';

export type SupportModalFunction = (template: TemplateKind, onConfirm: VoidFunction) => void;

export const useSupportModal = (): SupportModalFunction => {
  const [warnSupport, setWarnSupport] = useLocalStorage(TEMPLATE_WARN_SUPPORT);
  return React.useCallback<SupportModalFunction>(
    (template, onConfirm) => {
      const templateSupport = getTemplateSupport(template);
      const commonTemplat = isCommonTemplate(template);
      const showSupportModal =
        !isUpstream() &&
        template &&
        templateSupport.provider !== 'Full' &&
        templateSupport.parent !== 'Full';
      const onModalConfirm = (disable: boolean) => {
        if (disable) {
          setWarnSupport('false');
        }
        onConfirm();
      };
      return warnSupport === 'false' || !showSupportModal
        ? onConfirm()
        : createSupportModal({
            onConfirm: onModalConfirm,
            communityURL: templateSupport.providerURL || templateSupport.parentURL,
            isCommonTemplate: commonTemplat,
          });
    },
    [setWarnSupport, warnSupport],
  );
};
