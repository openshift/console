import { k8sBasePath } from '@console/internal/module/k8s';
import { VMWizardName, VMWizardMode } from '../constants/vm';

const ELLIPSIS = '…';

const ellipsizeLeft = (word) => `${ELLIPSIS}${word}`;

export const getConsoleAPIBase = () => {
  // avoid the extra slash when compose the URL by VncConsole
  return k8sBasePath.startsWith('/') ? k8sBasePath.substring(1) : k8sBasePath;
};

export const isConnectionEncrypted = () => window.location.protocol === 'https:';

export const parseURL = (url: string) => {
  try {
    return new URL(url);
  } catch (e) {
    return null;
  }
};

export const resolveOrigin = ({ hostname, origin, port }, maxHostnameParts) => {
  const hostnameParts = hostname.split('.');
  if (hostnameParts.length <= maxHostnameParts) {
    return origin;
  }

  const resolvedHostname = hostnameParts.slice(hostnameParts.length - maxHostnameParts).join('.');
  const resolvedPort = port ? `:${port}` : '';

  return `${ellipsizeLeft(resolvedHostname)}${resolvedPort}`;
};

export const resolvePathname = ({ pathname }, maxPathnameParts) => {
  const pathnameParts = pathname.split('/').filter((part) => part);
  if (pathnameParts.length <= maxPathnameParts) {
    return pathname;
  }

  const resolvedPathname = pathnameParts.slice(pathnameParts.length - maxPathnameParts).join('/');
  return `/${ellipsizeLeft(`/${resolvedPathname}`)}`;
};

export const resolveURL = ({ urlObj, maxHostnameParts, maxPathnameParts }) =>
  urlObj.origin === 'null'
    ? urlObj.href
    : `${resolveOrigin(urlObj, maxHostnameParts)}${resolvePathname(urlObj, maxPathnameParts)}`;

export const getVMWizardCreateLink = (
  namespace: string,
  itemName: VMWizardName = VMWizardName.WIZARD,
  mode: VMWizardMode = VMWizardMode.TEMPLATE,
  template?: string,
) => {
  // Overide mode if name is import.
  const wizardMode = itemName === VMWizardName.IMPORT ? VMWizardMode.IMPORT : mode;
  const type = itemName === VMWizardName.YAML ? '~new' : '~new-wizard';

  const params = new URLSearchParams();
  params.append('mode', wizardMode);
  params.append('template', template);

  return `/k8s/ns/${namespace || 'default'}/virtualization/${type}${params ? `?${params}` : ''}`; // covers 'yaml', new-wizard and default
};
