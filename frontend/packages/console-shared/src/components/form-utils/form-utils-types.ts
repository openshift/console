export interface FormFooterProps {
  handleSubmit?: () => void;
  handleReset?: () => void;
  handleCancel?: () => void;
  submitLabel?: string;
  resetLabel?: string;
  cancelLabel?: string;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage?: string;
  disableSubmit: boolean;
  showAlert?: boolean;
}
