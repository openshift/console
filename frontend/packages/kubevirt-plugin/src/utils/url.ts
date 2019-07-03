import { k8sBasePath } from '@console/internal/module/k8s';

export const getConsoleApiBase = () => {
  let base = k8sBasePath;
  base = base[0] === '/' ? base.substring(1) : base; // avoid the extra slash when compose the URL by VncConsole
  return base;
};

export const isConnectionEncrypted = () => window.location.protocol === 'https:';
