import { useResolvedExtensions, AddAction, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { useAddActionExtensions } from '../useAddActionExtensions';

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

jest.mock('@console/dynamic-plugin-sdk', () => {
  return {
    useResolvedExtensions: jest.fn(),
  };
});

describe('useAddActionExtensions', () => {
  const addAction1: ResolvedExtension<AddAction> = {
    type: 'dev-console.add/action',
    properties: {
      id: 'action1',
      label: 'Action 1',
      description: 'A description for action 1',
      href: '/action1',
    },
    pluginID: 'plugin1',
    pluginName: 'Plugin 1',
    uid: '1234-1',
  };
  const addAction2: ResolvedExtension<AddAction> = {
    type: 'dev-console.add/action',
    properties: {
      id: 'action2',
      label: 'Action 2',
      description: 'A description for action 2',
      href: '/action2',
    },
    pluginID: 'plugin2',
    pluginName: 'Plugin 2',
    uid: '1234-2',
  };
  const addAction3: ResolvedExtension<AddAction> = {
    type: 'dev-console.add/action',
    properties: {
      id: 'action3',
      label: 'Action 3',
      description: 'A description for action 3',
      href: '/action3',
    },
    pluginID: 'plugin3',
    pluginName: 'Plugin 3',
    uid: '1234-3',
  };

  afterEach(() => {
    delete window.SERVER_FLAGS.addPage;
  });

  it('return all actions if SERVER_FLAGS.addPage is not defined', () => {
    useResolvedExtensionsMock.mockReturnValue([[addAction1, addAction2, addAction3], true]);
    delete window.SERVER_FLAGS.addPage;

    testHook(() => {
      const [addActionExtensions, resolved] = useAddActionExtensions();
      expect(addActionExtensions).toEqual([addAction1, addAction2, addAction3]);
      expect(resolved).toEqual(true);
    });
  });

  it('return all actions if SERVER_FLAGS.addPage customization is empty', () => {
    useResolvedExtensionsMock.mockReturnValue([[addAction1, addAction2, addAction3], true]);
    window.SERVER_FLAGS.addPage = '{}';

    testHook(() => {
      const [addActionExtensions, resolved] = useAddActionExtensions();
      expect(addActionExtensions).toEqual([addAction1, addAction2, addAction3]);
      expect(resolved).toEqual(true);
    });
  });

  it('return filtered actions if SERVER_FLAGS.addPage contains some disabledActions', () => {
    useResolvedExtensionsMock.mockReturnValue([[addAction1, addAction2, addAction3], true]);
    window.SERVER_FLAGS.addPage = '{"disabledActions":["action2"]}';

    testHook(() => {
      const [addActionExtensions, resolved] = useAddActionExtensions();
      expect(addActionExtensions).toEqual([addAction1, addAction3]);
      expect(resolved).toEqual(true);
    });
  });
});
