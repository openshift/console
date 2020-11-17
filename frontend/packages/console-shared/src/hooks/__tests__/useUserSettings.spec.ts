import * as redux from 'react-redux';
import * as k8s from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { useUserSettings } from '../useUserSettings';

import Spy = jasmine.Spy;

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const spyAndReturn = (spy: Spy) => (returnValue: any) =>
  new Promise((resolve) =>
    spy.and.callFake((...args) => {
      resolve(args);
      return returnValue;
    }),
  );

const waitAndExpect = (callback) => {
  setTimeout(() => {
    callback();
  }, 0);
};

describe('useUserSettings', () => {
  let spyK8sGet: Spy;
  let spyK8sPatch: Spy;
  let spyK8sCreate: Spy;
  beforeEach(() => {
    spyK8sGet = spyOn(k8s, 'k8sGet');
    spyK8sPatch = spyOn(k8s, 'k8sPatch');
    spyK8sCreate = spyOn(k8s, 'k8sCreate');
    spyAndReturn(spyK8sGet)(Promise.resolve({}));
    spyAndReturn(spyK8sPatch)(Promise.resolve({}));
    spyAndReturn(spyK8sCreate)(Promise.resolve({}));
    spyOn(redux, 'useSelector').and.returnValues({ user: {} });
  });

  it('should return empty state', (done) => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([
      { data: { 'devconsole.topology.key': '' } },
      true,
    ]);
    testHook(() => {
      const [settings, setSettings, loaded] = useUserSettings('devconsole.topology.key');
      expect(setSettings).toBeDefined();
      waitAndExpect(() => {
        expect(settings).toEqual('');
        expect(loaded).toEqual(true);
        done();
      });
    });
  });

  it('should return value from default and run patch to update configMap', (done) => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([
      { data: { 'devconsole.topology.key1': true } },
      true,
    ]);
    testHook(() => {
      const [settings, setSettings] = useUserSettings('devconsole.topology.key', 'list');
      expect(setSettings).toBeDefined();
      waitAndExpect(() => {
        expect(settings).toEqual('list');
        expect(spyK8sPatch).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  it('should call side effects if configmap not loaded', (done) => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([null, true, true]);
    testHook(() => {
      const [, setSettings] = useUserSettings('devconsole.topology.key');
      expect(setSettings).toBeDefined();
      waitAndExpect(() => {
        expect(spyK8sGet).toHaveBeenCalledTimes(1);
        expect(spyK8sCreate).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
