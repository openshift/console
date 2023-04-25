import { confirmModal } from '@console/internal/components/modals/confirm-modal';

const cloudShellConfirmationModal = (action) => {
  return confirmModal({
    // t('webterminal-plugin~Close terminal?')
    // t('webterminal-plugin~This will close the terminal session. Content in the terminal will not be restored on next session.')
    // t('webterminal-plugin~Yes')
    // t('webterminal-plugin~No')
    titleKey: 'webterminal-plugin~Close terminal?',
    messageKey:
      'webterminal-plugin~This will close the terminal session. Content in the terminal will not be restored on next session.',
    btnTextKey: 'webterminal-plugin~Yes',
    submitDanger: true,
    cancelTextKey: 'webterminal-plugin~No',
    executeFn: () => Promise.resolve(action()),
  });
};

export default cloudShellConfirmationModal;
