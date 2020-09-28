export interface FormFooterProps {
  handleSubmit?: () => void;
  handleReset?: () => void;
  handleCancel?: () => void;
  sticky?: boolean;
  submitLabel?: string;
  resetLabel?: string;
  cancelLabel?: string;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage?: string;
  disableSubmit: boolean;
  showAlert?: boolean;
  infoTitle?: string;
  infoMessage?: string;
  hideSubmit?: boolean;
}

export interface ActionGroupWithIconsProps {
  onSubmit: () => void;
  onClose: () => void;
  isDisabled?: boolean;
}
