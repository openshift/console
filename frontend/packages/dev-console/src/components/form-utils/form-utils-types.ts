export interface FormFooterProps {
  handleSubmit?: () => void;
  handleReset: () => void;
  isSubmitting: boolean;
  errorMessage: string;
  successMessage: string;
  disableSubmit: boolean;
  showAlert?: boolean;
}
