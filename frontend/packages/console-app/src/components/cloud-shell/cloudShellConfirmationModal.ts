import i18n from '@console/internal/i18n';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';

const cloudShellConfirmationModal = (action) => {
  return confirmModal({
    title: i18n.t('cloudshell~Close Terminal?'),
    message: i18n.t(
      'cloudshell~This will close the terminal session. Content in the terminal will not be restored on next session.',
    ),
    btnText: i18n.t('cloudshell~Yes'),
    submitDanger: true,
    cancelText: i18n.t('cloudshell~No'),
    executeFn: () => Promise.resolve(action()),
  });
};

export default cloudShellConfirmationModal;
