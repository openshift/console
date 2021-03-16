import * as React from 'react';
import { TemplateKind } from '@console/internal/module/k8s';

import { useLocalStorage } from './use-local-storage';
import { TEMPLATE_WARN_SUPPORT } from '../constants';
import { createSupportModal } from '../components/modals/support-modal/support-modal';
import { getTemplateSupport } from '../selectors/vm-template/basic';

export type SupportModalFunction = (template: TemplateKind, onConfirm: VoidFunction) => void;

export const useSupportModal = (): SupportModalFunction => {
  const [warnSupport, setWarnSupport] = useLocalStorage(TEMPLATE_WARN_SUPPORT);
  return React.useCallback<SupportModalFunction>(
    (template, onConfirm) => {
      const isUpstream = window.SERVER_FLAGS.branding === 'okd';
      const templateSupport = getTemplateSupport(template);
      const showSupportModal =
        !isUpstream &&
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
          });
    },
    [setWarnSupport, warnSupport],
  );
};
