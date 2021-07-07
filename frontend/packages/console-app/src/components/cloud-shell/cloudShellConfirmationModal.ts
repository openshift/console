import { confirmModal } from '@console/internal/components/modals/confirm-modal';

const cloudShellConfirmationModal = (action) => {
  return confirmModal({
    // t('console-app~Close terminal?')
    // t('console-app~This will close the terminal session. Content in the terminal will not be restored on next session.')
    // t('console-app~Yes')
    // t('console-app~No')
    titleKey: 'console-app~Close terminal?',
    messageKey:
      'console-app~This will close the terminal session. Content in the terminal will not be restored on next session.',
    btnTextKey: 'console-app~Yes',
    submitDanger: true,
    cancelTextKey: 'console-app~No',
    executeFn: () => Promise.resolve(action()),
  });
};

export default cloudShellConfirmationModal;
