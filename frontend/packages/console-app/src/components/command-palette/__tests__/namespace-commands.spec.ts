import type { TFunction } from 'i18next';
import { ALL_NAMESPACES_KEY } from '@console/dynamic-plugin-sdk/src/constants';
import { buildNamespaceCommands } from '../namespace-commands';

const t = ((key: string) => key.replace(/^.*~/, '')) as unknown as TFunction;

const namespaces = [{ metadata: { name: 'default' } }, { metadata: { name: 'kube-system' } }];

describe('buildNamespaceCommands', () => {
  it.each`
    isProjects | allTitle
    ${false}   | ${'All namespaces'}
    ${true}    | ${'All projects'}
  `(
    'should start with "$allTitle" when the user can list namespaces',
    ({ isProjects, allTitle }) => {
      const commands = buildNamespaceCommands({
        namespaces,
        canListNamespaces: true,
        isProjects,
        t,
      });

      expect(commands.map(({ title, namespace }) => ({ title, namespace }))).toEqual([
        { title: allTitle, namespace: ALL_NAMESPACES_KEY },
        { title: 'default', namespace: 'default' },
        { title: 'kube-system', namespace: 'kube-system' },
      ]);
    },
  );

  it('should leave out the all namespaces command when the user cannot list namespaces', () => {
    const commands = buildNamespaceCommands({
      namespaces,
      canListNamespaces: false,
      isProjects: false,
      t,
    });

    expect(commands.map((command) => command.namespace)).toEqual(['default', 'kube-system']);
  });
});
