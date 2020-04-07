import { confirmModal } from '@console/internal/components/modals/confirm-modal';

const cloudShellConfirmationModal = (action) => {
  return confirmModal({
    title: 'Close Terminal?',
    message:
      'This will close the terminal session. Content in the terminal will not be restored on next session.',
    btnText: 'Yes',
    submitDanger: true,
    cancelText: 'No',
    executeFn: () => Promise.resolve(action()),
  });
};

export default cloudShellConfirmationModal;
