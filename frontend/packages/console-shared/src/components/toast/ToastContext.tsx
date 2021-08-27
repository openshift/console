import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';

export const ToastVariant = AlertVariant;

export type ToastOptions = {
  // Optional ID identifying this toast. If not provided, one will be generated.
  id?: string;
  // The toast title.
  title: string;
  // The toast variant, one of: success, danger, warning, info, default
  variant: AlertVariant;
  // The toast content.
  content: React.ReactNode;
  // Optional actions to display in the toast.
  actions?: {
    // The action label.
    label: string;
    // The action callback.
    callback: () => void;
    // If `true`, executing this action will dismiss the toast.
    dismiss?: boolean;
    // Sets the base component to render. defaults to button
    component?: React.ElementType<any> | React.ComponentType<any>;
  }[];
  // If `true`, displays a close button.
  dismissible?: boolean;
  // If set to true, the time out is 8000 milliseconds.
  // If a number is provided, alert will be dismissed after that amount of time in milliseconds.
  timeout?: number | boolean;
  // Callback when the toast is removed.
  onRemove?: (id: string) => void;
};

export type ToastContextType = {
  // Add a toast alert. Returns the toast ID.
  addToast: (options: ToastOptions) => string;
  // Remove a toast alert.
  removeToast: (id: string) => void;
};

export default React.createContext<ToastContextType>({} as any);
