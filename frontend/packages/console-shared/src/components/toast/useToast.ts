import { useContext } from 'react';
import { ToastContext } from './ToastContext';

export const useToast = () => useContext(ToastContext);
