import * as React from 'react';
import { useLocalStorage } from './use-local-storage';
import { TEMPLATE_WARN_SUPPORT } from '../constants';
import { createSupportModal } from '../components/modals/support-modal/support-modal';
import { isTemplateSupported } from '../selectors/vm-template/basic';
import { TemplateItem } from '../types/template';

export type SupportModalFunction = (template: TemplateItem, onConfirm: VoidFunction) => void;

export const useSupportModal = (): SupportModalFunction => {
  const [warnSupport, setWarnSupport] = useLocalStorage(TEMPLATE_WARN_SUPPORT);
  return React.useCallback<SupportModalFunction>(
    (template, onConfirm) => {
      const showSupportModal = template && !isTemplateSupported(template.variants[0]);
      const onModalConfirm = (disable: boolean) => {
        if (disable) {
          setWarnSupport('false');
        }
        onConfirm();
      };
      return warnSupport === 'false' || !showSupportModal
        ? onConfirm()
        : createSupportModal({ onConfirm: onModalConfirm });
    },
    [setWarnSupport, warnSupport],
  );
};
