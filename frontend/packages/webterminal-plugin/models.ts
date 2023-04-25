import { K8sModel as K8sKind } from '@console/dynamic-plugin-sdk/src/api/common-types';

export const DevWorkspaceTemplateModel: K8sKind = {
  apiGroup: 'workspace.devfile.io',
  apiVersion: 'v1alpha2',
  label: 'DevWorkspaceTemplate',
  // t('webterminal-plugin~DevWorkspaceTemplate')
  labelKey: 'webterminal-plugin~DevWorkspaceTemplate',
  // t('webterminal-plugin~DevWorkspaceTemplates')
  labelPluralKey: 'webterminal-plugin~DevWorkspaceTemplates',
  plural: 'devworkspacetemplates',
  abbr: 'DWT',
  kind: 'DevWorkspaceTemplate',
  labelPlural: 'devworkspacetemplates',
  namespaced: true,
};

export const WorkspaceModel: K8sKind = {
  kind: 'DevWorkspace',
  label: 'DevWorkspace',
  labelPlural: 'devworkspaces',
  apiGroup: 'workspace.devfile.io',
  apiVersion: 'v1alpha2',
  abbr: 'DW',
  namespaced: true,
  crd: true,
  plural: 'devworkspaces',
  propagationPolicy: 'Background',
};

export const v1alpha1WorkspaceModel: K8sKind = Object.assign(
  { ...WorkspaceModel },
  {
    apiVersion: 'v1alpha1',
  },
);
