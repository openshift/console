import * as React from 'react';
import { ContextProvider, ResolvedExtension } from '@console/dynamic-plugin-sdk';

type EnhancedProviderProps = {
  contextProperties: ResolvedExtension<ContextProvider>['properties'];
  children: React.ReactNode;
};

const EnhancedProvider: React.FC<EnhancedProviderProps> = ({ contextProperties, children }) => {
  const { provider: ContextProviderComponent, useValueHook } = contextProperties;

  const value = useValueHook();
  return <ContextProviderComponent value={value}>{children}</ContextProviderComponent>;
};

export default EnhancedProvider;
