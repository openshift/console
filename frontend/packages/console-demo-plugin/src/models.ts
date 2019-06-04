import { K8sKind } from '@console/internal/module/k8s';

export const FooBarModel: K8sKind = {
  apiGroup: 'test.io',
  apiVersion: 'v1alpha1',
  kind: 'FooBar',
  label: 'Foo Bar',
  labelPlural: 'Foo Bars',
  path: 'foobars',
  plural: 'foobars',
  abbr: 'FOOBAR',
  namespaced: true,
  id: 'foobar',
  crd: true,
};

export const MyTemplatesModel: K8sKind = {
  label: 'My Specialized Template',
  labelPlural: 'My Specialized Templates',
  apiVersion: 'v1',
  path: 'templates',
  apiGroup: 'template.openshift.io',
  plural: 'mytemplates',
  namespaced: true,
  abbr: 'MT',
  kind: 'Template',
  id: 'mytemplate',
  specialized: true,
  selector: {
    matchLabels: { my: 'yes' },
  },
};
