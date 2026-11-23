import type { TFunction } from 'i18next';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { ALL_NAMESPACES_KEY } from '@console/dynamic-plugin-sdk/src/constants';
import { buildResourceCommands } from '../resource-commands';

const t = ((key: string) => `t(${key})`) as unknown as TFunction;

const model = (overrides: Partial<K8sModel>): K8sModel => ({
  abbr: 'X',
  kind: 'Widget',
  label: 'Widget',
  labelPlural: 'Widgets',
  plural: 'widgets',
  apiGroup: 'example.com',
  apiVersion: 'v1',
  namespaced: true,
  verbs: ['list', 'get'],
  ...overrides,
});

const groupVersionMap = {
  'example.com': { versions: ['v1', 'v1beta1'], preferredVersion: 'v1' },
};

const build = (
  models: K8sModel[],
  overrides: Partial<Parameters<typeof buildResourceCommands>[0]> = {},
) =>
  buildResourceCommands({
    models,
    groupVersionMap,
    navModels: [],
    activeNamespace: 'my-project',
    t,
    ...overrides,
  });

describe('buildResourceCommands', () => {
  it('should link namespaced models to the active namespace and others to the cluster', () => {
    const commands = build([
      model({ kind: 'Widget' }),
      model({ kind: 'Gadget', labelPlural: 'Gadgets', plural: 'gadgets', namespaced: false }),
    ]);

    expect(commands.map(({ title, href }) => ({ title, href }))).toEqual([
      { title: 'Widgets', href: '/k8s/ns/my-project/example.com~v1~Widget' },
      { title: 'Gadgets', href: '/k8s/cluster/example.com~v1~Gadget' },
    ]);
  });

  it('should link namespaced models to all namespaces when no namespace is active', () => {
    expect(build([model({})], { activeNamespace: ALL_NAMESPACES_KEY })[0].href).toBe(
      '/k8s/all-namespaces/example.com~v1~Widget',
    );
  });

  it('should translate the plural label, add the kind and short names as aliases and the plural and group as keywords', () => {
    const [command] = build([
      model({ labelPluralKey: 'public~Widgets', shortNames: ['wd', 'wdg'] }),
    ]);

    expect(command.title).toBe('t(public~Widgets)');
    expect(command.aliases).toEqual(['Widget', 'wd', 'wdg']);
    expect(command.keywords).toEqual(['widgets', 'example.com']);
  });

  it.each`
    description                                    | excluded
    ${'cannot be listed'}                          | ${model({ verbs: ['get'] })}
    ${'is in a blocked group'}                     | ${model({ apiGroup: 'authorization.openshift.io' })}
    ${'is a blocked resource'}                     | ${model({ apiGroup: 'events.k8s.io', apiVersion: 'v1beta1', kind: 'Event' })}
    ${'is not the preferred version of its group'} | ${model({ apiVersion: 'v1beta1' })}
  `('should skip a model that $description', ({ excluded }) => {
    expect(build([model({}), excluded]).map((command) => command.id)).toEqual([
      'resource:example.com~v1~Widget',
    ]);
  });

  it('should keep a non-preferred version when its group and kind have no preferred version', () => {
    expect(build([model({ apiVersion: 'v1beta1' })]).map((command) => command.id)).toEqual([
      'resource:example.com~v1beta1~Widget',
    ]);
  });

  it('should skip a model that already has a resource page in the active perspective', () => {
    const commands = build(
      [model({}), model({ apiGroup: undefined, kind: 'Pod', labelPlural: 'Pods' })],
      {
        navModels: [{ group: 'core', version: 'v1', kind: 'Pod' }],
      },
    );

    expect(commands.map((command) => command.title)).toEqual(['Widgets']);
  });
});
