import { confirmModal } from '@console/internal/components/modals/confirm-modal';

const cloudShellConfirmationModal = (action) => {
  return confirmModal({
    // t('cloudshell~Close terminal?')
    // t('cloudshell~This will close the terminal session. Content in the terminal will not be restored on next session.')
    // t('cloudshell~Yes')
    // t('cloudshell~No')
    titleKey: 'cloudshell~Close terminal?',
    messageKey:
      'cloudshell~This will close the terminal session. Content in the terminal will not be restored on next session.',
    btnTextKey: 'cloudshell~Yes',
    submitDanger: true,
    cancelTextKey: 'cloudshell~No',
    executeFn: () => Promise.resolve(action()),
  });
};

export default cloudShellConfirmationModal;
