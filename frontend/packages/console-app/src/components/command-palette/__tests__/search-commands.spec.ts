import { PodModel } from '@console/internal/models';
import { MAX_RESULTS_PER_GROUP, searchCommands } from '../search-commands';
import type { CommandPaletteCommand } from '../types';

type SearchTerms = {
  aliases?: string[];
  keywords?: string[];
};

const page = (
  title: string,
  perspective = 'admin',
  { aliases = [], keywords = [] }: SearchTerms = {},
): CommandPaletteCommand => ({
  type: 'page',
  id: `${perspective}-${title}`,
  title,
  aliases,
  keywords,
  perspective,
  href: `/${perspective}/${title}`,
});

const resource = (
  title: string,
  { aliases = [], keywords = [] }: SearchTerms = {},
): CommandPaletteCommand => ({
  type: 'resource',
  id: `resource-${title}`,
  title,
  aliases,
  keywords,
  model: PodModel,
  href: `/k8s/ns/default/${title}`,
});

const namespace = (name: string): CommandPaletteCommand => ({
  type: 'namespace',
  id: `namespace-${name}`,
  title: name,
  aliases: [],
  keywords: [],
  namespace: name,
});

const titlesByGroup = (commands: CommandPaletteCommand[], query: string) =>
  searchCommands(commands, query, 'admin').map((group) => ({
    type: group.type,
    titles: group.commands.map((command) => command.title),
  }));

describe('searchCommands', () => {
  it.each(['', '   '])(
    'should list only the active perspective pages in their original order for the query %j',
    (query) => {
      const commands = [
        page('Overview'),
        page('Topology', 'dev'),
        resource('Pods'),
        namespace('default'),
        page('Search'),
      ];

      expect(titlesByGroup(commands, query)).toEqual([
        { type: 'page', titles: ['Overview', 'Search'] },
      ]);
    },
  );

  it('should rank exact title, exact alias, prefix, word-start, substring, alias or keyword prefix and fuzzy matches in that order', () => {
    const commands = [
      page('Public overview dashboard'),
      page('Workloads', 'admin', { keywords: ['pods'] }),
      page('Replica units', 'admin', { aliases: ['pods'] }),
      page('Hostpods'),
      page('Edit pod'),
      page('Pod security'),
      page('Running units', 'admin', { aliases: ['Pod'] }),
      page('Pod'),
    ];

    expect(titlesByGroup(commands, 'pod')).toEqual([
      {
        type: 'page',
        titles: [
          'Pod',
          'Running units',
          'Pod security',
          'Edit pod',
          'Hostpods',
          'Workloads',
          'Replica units',
          'Public overview dashboard',
        ],
      },
    ]);
  });

  it.each`
    query              | expected
    ${'pod'}           | ${'Pods'}
    ${'svc'}           | ${'Services'}
    ${'cephblockpool'} | ${'CephBlockPools'}
  `('should list $expected first when $query is its kind or short name', ({ query, expected }) => {
    const commands = [
      page('PodDisruptionBudgets', 'admin', {
        aliases: ['PodDisruptionBudget', 'pdb'],
        keywords: ['Workloads', 'poddisruptionbudgets', 'policy'],
      }),
      page('Pods', 'admin', { aliases: ['Pod', 'po'], keywords: ['Workloads', 'pods'] }),
      resource('ServiceBindings', {
        aliases: ['ServiceBinding', 'svcb'],
        keywords: ['servicebindings', 'binding.example.com'],
      }),
      resource('Services', { aliases: ['Service', 'svc'], keywords: ['services'] }),
      resource('CephBlockPoolRadosNamespaces', {
        aliases: ['CephBlockPoolRadosNamespace'],
        keywords: ['cephblockpoolradosnamespaces', 'ceph.rook.io'],
      }),
      resource('CephBlockPools', {
        aliases: ['CephBlockPool'],
        keywords: ['cephblockpools', 'ceph.rook.io'],
      }),
    ];

    expect(searchCommands(commands, query, 'admin')[0].commands[0].title).toBe(expected);
  });

  it('should not rank a command above an exact kind or short name match because its API group matches', () => {
    const commands = [
      resource('DaemonSets', { aliases: ['DaemonSet', 'ds'], keywords: ['daemonsets', 'apps'] }),
      resource('Applications', {
        aliases: ['Application', 'app', 'apps'],
        keywords: ['applications', 'argoproj.io'],
      }),
    ];

    expect(titlesByGroup(commands, 'apps')).toEqual([
      { type: 'resource', titles: ['Applications', 'DaemonSets'] },
    ]);
  });

  it('should match case-insensitively and drop commands that do not match', () => {
    const commands = [page('Nodes'), resource('Pods'), namespace('kube-system')];

    expect(titlesByGroup(commands, 'PODS')).toEqual([{ type: 'resource', titles: ['Pods'] }]);
  });

  it('should sort equally ranked active perspective pages first, then shorter titles, then by title', () => {
    const commands = [page('Builds', 'dev'), page('Build configs'), page('Buildx'), page('Builds')];

    expect(
      searchCommands(commands, 'build', 'admin')[0].commands.map(
        (command) => command.type === 'page' && `${command.perspective}:${command.title}`,
      ),
    ).toEqual(['admin:Builds', 'admin:Buildx', 'admin:Build configs', 'dev:Builds']);
  });

  it('should put the group with the best match first', () => {
    const commands = [
      page('Deployments', 'admin', { aliases: ['Deployment', 'deploy'] }),
      resource('Endpoints', { aliases: ['Endpoints', 'ep'] }),
    ];

    expect(titlesByGroup(commands, 'ep')).toEqual([
      { type: 'resource', titles: ['Endpoints'] },
      { type: 'page', titles: ['Deployments'] },
    ]);
  });

  it('should order groups with equally good matches as pages, resource types, then namespaces', () => {
    const commands = [namespace('pods'), resource('Pods'), page('Pods')];

    expect(titlesByGroup(commands, 'pods').map((group) => group.type)).toEqual([
      'page',
      'resource',
      'namespace',
    ]);
  });

  it('should show at most the group limit of results per group', () => {
    const commands = Array.from({ length: MAX_RESULTS_PER_GROUP + 2 }, (_, index) =>
      namespace(`team-${index}`),
    );

    expect(searchCommands(commands, 'team', 'admin')[0].commands).toHaveLength(8);
  });
});
