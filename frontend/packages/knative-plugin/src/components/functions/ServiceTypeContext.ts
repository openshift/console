import { createContext } from 'react';
import { ServiceTypeValue } from '../../types';

export const KnativeServiceTypeContext = createContext(ServiceTypeValue.Service);
