import type { TFunction } from 'i18next';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { ALL_NAMESPACES_KEY } from '@console/dynamic-plugin-sdk/src/constants';
import type {
  HrefNavItem,
  NavExtension,
  NavSection,
  ResourceClusterNavItem,
  ResourceNSNavItem,
  Separator,
} from '@console/dynamic-plugin-sdk/src/extensions/navigation';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { PodModel } from '@console/internal/models';
import type { PagePerspective } from '../page-commands';
import { buildPageCommands } from '../page-commands';

const t = ((key: string) => `t(${key})`) as unknown as TFunction;

const loaded = <E extends NavExtension>(extension: E): LoadedExtension<NavExtension> => ({
  ...extension,
  uid: `uid-${extension.properties.id}`,
  pluginName: 'test-plugin',
});

const section = (properties: NavSection['properties']) =>
  loaded<NavSection>({ type: 'console.navigation/section', properties });

const separator = (properties: Separator['properties']) =>
  loaded<Separator>({ type: 'console.navigation/separator', properties });

const href = (properties: HrefNavItem['properties']) =>
  loaded<HrefNavItem>({ type: 'console.navigation/href', properties });

const resourceNs = (properties: ResourceNSNavItem['properties']) =>
  loaded<ResourceNSNavItem>({ type: 'console.navigation/resource-ns', properties });

const resourceCluster = (properties: ResourceClusterNavItem['properties']) =>
  loaded<ResourceClusterNavItem>({ type: 'console.navigation/resource-cluster', properties });

const WidgetModel: K8sModel = {
  abbr: 'W',
  kind: 'Widget',
  label: 'Widget',
  labelPlural: 'Widgets',
  plural: 'widgets',
  apiGroup: 'example.com',
  apiVersion: 'v1',
  shortNames: ['wd'],
};

const models: { [key: string]: K8sModel } = {
  Pod: { ...PodModel, shortNames: ['po'] },
  'example.com~v1~Widget': WidgetModel,
};

const perspectives: PagePerspective[] = [{ id: 'admin', default: true }, { id: 'dev' }];

const build = (
  navExtensions: LoadedExtension<NavExtension>[],
  overrides: Partial<Parameters<typeof buildPageCommands>[0]> = {},
) =>
  buildPageCommands({
    navExtensions,
    perspectives,
    activePerspective: 'admin',
    activeNamespace: 'my-project',
    lastNamespace: null,
    models,
    t,
    ...overrides,
  });

const summarize = (commands: ReturnType<typeof buildPageCommands>) =>
  commands.map(({ title, section: sectionName, perspective, href: path }) => ({
    title,
    section: sectionName,
    perspective,
    href: path,
  }));

describe('buildPageCommands', () => {
  it('should list the pages of every perspective in sidebar order with their section names', () => {
    const navExtensions = [
      section({ id: 'home', name: 'Home' }),
      href({ id: 'overview', name: 'Overview', section: 'home', href: '/dashboards' }),
      href({
        id: 'search',
        name: 'Search',
        section: 'home',
        href: '/search/all-namespaces',
        insertBefore: 'overview',
      }),
      separator({ id: 'home-separator', section: 'home' }),
      section({ id: 'workloads', name: 'Workloads' }),
      resourceNs({
        id: 'pods',
        section: 'workloads',
        model: { group: 'core', version: 'v1', kind: 'Pod' },
      }),
      resourceNs({
        id: 'unknown',
        section: 'workloads',
        model: { group: 'x.io', version: 'v1', kind: 'Gone' },
      }),
      resourceCluster({
        id: 'widgets',
        model: { group: 'example.com', version: 'v1', kind: 'Widget' },
      }),
      href({ id: 'orphan', name: 'Orphan', section: 'missing', href: '/orphan' }),
      href({
        id: 'topology',
        name: 'Topology',
        perspective: 'dev',
        href: '/topology',
        namespaced: true,
      }),
    ];

    expect(summarize(build(navExtensions))).toEqual([
      { title: 'Search', section: 'Home', perspective: 'admin', href: '/search/all-namespaces' },
      { title: 'Overview', section: 'Home', perspective: 'admin', href: '/dashboards' },
      {
        title: 't(public~Pods)',
        section: 'Workloads',
        perspective: 'admin',
        href: '/k8s/ns/my-project/core~v1~Pod',
      },
      {
        title: 'Widgets',
        section: undefined,
        perspective: 'admin',
        href: '/k8s/cluster/example.com~v1~Widget',
      },
      {
        title: 'Topology',
        section: undefined,
        perspective: 'dev',
        href: '/topology/ns/my-project',
      },
    ]);
  });

  it.each`
    description                                     | extension                                                                                                  | options                                    | expected
    ${'a plain href'}                               | ${href({ id: 'a', name: 'A', href: '/search' })}                                                           | ${{}}                                      | ${'/search'}
    ${'a namespaced href'}                          | ${href({ id: 'a', name: 'A', href: '/topology', namespaced: true })}                                       | ${{}}                                      | ${'/topology/ns/my-project'}
    ${'a namespaced href in all namespaces'}        | ${href({ id: 'a', name: 'A', href: '/topology', namespaced: true })}                                       | ${{ activeNamespace: ALL_NAMESPACES_KEY }} | ${'/topology/all-namespaces'}
    ${'a prefixNamespaced href'}                    | ${href({ id: 'a', name: 'A', href: '/k8s/cluster/deployments', prefixNamespaced: true })}                  | ${{}}                                      | ${'/k8s/ns/my-project/deployments'}
    ${'a namespaced resource'}                      | ${resourceNs({ id: 'a', name: 'A', model: { group: 'core', version: 'v1', kind: 'Pod' } })}                | ${{}}                                      | ${'/k8s/ns/my-project/core~v1~Pod'}
    ${'a namespaced resource after all namespaces'} | ${resourceNs({ id: 'a', name: 'A', model: { group: 'core', version: 'v1', kind: 'Pod' } })}                | ${{ lastNamespace: ALL_NAMESPACES_KEY }}   | ${'/k8s/all-namespaces/core~v1~Pod'}
    ${'a cluster resource'}                         | ${resourceCluster({ id: 'a', name: 'A', model: { group: 'example.com', version: 'v1', kind: 'Widget' } })} | ${{}}                                      | ${'/k8s/cluster/example.com~v1~Widget'}
  `('should link $description the way the sidebar does', ({ extension, options, expected }) => {
    expect(build([extension], options).map((command) => command.href)).toEqual([expected]);
  });

  it('should drop a page from another perspective when the active perspective links to the same href', () => {
    const navExtensions = [
      href({ id: 'admin-search', name: 'Search', href: '/search/all-namespaces' }),
      href({
        id: 'dev-search',
        name: 'Search',
        perspective: 'dev',
        href: '/search/all-namespaces',
      }),
      href({ id: 'dev-builds', name: 'Builds', perspective: 'dev', href: '/builds' }),
    ];

    expect(build(navExtensions, { activePerspective: 'dev' }).map((command) => command.id)).toEqual(
      ['page:uid-dev-search', 'page:uid-dev-builds'],
    );
  });

  it('should add the kind and short names as aliases and the section and plural as keywords', () => {
    const navExtensions = [
      section({ id: 'workloads', name: 'Workloads' }),
      resourceNs({
        id: 'pods',
        name: 'Pods',
        section: 'workloads',
        model: { group: 'core', version: 'v1', kind: 'Pod' },
      }),
    ];

    const [command] = build(navExtensions);

    expect(command.aliases).toEqual(['Pod', 'po']);
    expect(command.keywords).toEqual(['Workloads', 'pods']);
  });
});
