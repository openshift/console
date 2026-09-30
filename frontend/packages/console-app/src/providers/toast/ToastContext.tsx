import { createContext } from 'react';
import type { ToastContextValues } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

export const ToastContext = createContext<ToastContextValues>({} as any);
