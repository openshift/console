import * as _ from 'lodash';
import { history } from '@console/internal/components/utils/router';
import { k8sBasePath, TemplateKind } from '@console/internal/module/k8s';
import { VMTabURLEnum } from '../components/vms/types';
import { VMWizardURLParams } from '../constants/url-params';
import { VMWizardMode, VMWizardName, VMWizardView } from '../constants/vm';
import { getName, getNamespace } from '../selectors';
import { isCommonTemplate } from '../selectors/vm-template/basic';
import { VMKind } from '../types';
import { VMWizardBootSourceParams, VMWizardInitialData } from '../types/url';

const ELLIPSIS = '…';

const ellipsizeLeft = (word) => `${ELLIPSIS}${word}`;

export const redirectToTab = (tabPath: string) => {
  const currLocation = history.location?.pathname;
  if (currLocation && currLocation.includes(tabPath)) {
    return;
  }
  history.push(tabPath);
};

export const getVMTabURL = (vm: VMKind, tabName: VMTabURLEnum) =>
  `/ns/${getNamespace(vm)}/virtualmachines/${getName(vm)}/${tabName}`;

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

export const getVMWizardCreateLink = ({
  namespace,
  wizardName,
  mode,
  view,
  template,
  name,
  bootSource,
  startVM,
}: {
  namespace?: string;
  wizardName: VMWizardName;
  mode?: VMWizardMode;
  view?: VMWizardView;
  template?: TemplateKind;
  name?: string;
  bootSource?: VMWizardBootSourceParams;
  startVM?: boolean;
}) => {
  const params = new URLSearchParams();
  const initialData: VMWizardInitialData = {};

  if (wizardName === VMWizardName.BASIC) {
    if (namespace) {
      params.append(VMWizardURLParams.NAMESPACE, namespace);
    }
    if (template) {
      if (isCommonTemplate(template)) {
        initialData.commonTemplateName = template.metadata.name;
      } else {
        initialData.userTemplateName = template.metadata.name;
        initialData.userTemplateNs = template.metadata.namespace;
      }
      params.append(VMWizardURLParams.INITIAL_DATA, JSON.stringify(initialData));
    }
    const paramsString = params.toString() ? `?${params}` : '';
    return `/k8s/virtualization/~new-from-template${paramsString}`;
  }

  const type = wizardName === VMWizardName.YAML ? '~new' : '~new-wizard';

  if (mode && mode !== VMWizardMode.VM) {
    params.append(VMWizardURLParams.MODE, mode);
  }

  if (template) {
    if (isCommonTemplate(template)) {
      initialData.commonTemplateName = template.metadata.name;
    } else {
      initialData.userTemplateName = template.metadata.name;
      initialData.userTemplateNs = template.metadata.namespace;
    }
  }

  if (name) {
    initialData.name = name;
  }

  if (startVM) {
    initialData.startVM = startVM;
  }

  if (bootSource) {
    initialData.source = bootSource;
  }

  if (mode === VMWizardMode.IMPORT && view === VMWizardView.ADVANCED) {
    // only valid combination in the wizard for now
    params.append(VMWizardURLParams.VIEW, view);
  }

  if (!_.isEmpty(initialData)) {
    params.append(VMWizardURLParams.INITIAL_DATA, JSON.stringify(initialData));
  }

  const paramsString = params.toString() ? `?${params}` : '';

  return `/k8s/ns/${namespace || 'default'}/virtualization/${type}${paramsString}`;
};

export const parseVMWizardInitialData = (searchParams: URLSearchParams): VMWizardInitialData => {
  let initialData: VMWizardInitialData = {};
  const initDataParams = searchParams.get(VMWizardURLParams.INITIAL_DATA);
  if (VMWizardMode.VM && initDataParams) {
    try {
      initialData = JSON.parse(initDataParams);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Cannot parse source params', e);
      initialData = {};
    }
  }
  return initialData;
};
