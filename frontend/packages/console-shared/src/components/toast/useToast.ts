import { useContext } from 'react';
import { ToastContext } from '@console/app/src/providers/toast/ToastContext';

export const useToast = () => useContext(ToastContext);
