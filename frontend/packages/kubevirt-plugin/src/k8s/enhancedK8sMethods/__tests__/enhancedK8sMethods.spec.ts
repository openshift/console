import { EnhancedK8sMethods } from '../enhancedK8sMethods';
import { HistoryItem, HistoryType } from '../types';

import { VirtualMachineModel } from '../../../models';
import { VMWrapper } from '../../wrapper/vm/vm-wrapper';
import { PatchBuilder } from '@console/shared/src/k8s';
import { K8sKind, K8sResourceCommon, Patch } from '@console/internal/module/k8s';
import { K8sKillError } from '../errors';

const disableHistoryOpts = { disableHistory: true };

const spyEnhancedK8sMethods = () => {
  const methods = new EnhancedK8sMethods();
  // mocks the approximate behaviour of CRUD methods
  const methodsUnchecked = methods as any;
  methodsUnchecked.k8sCreate = async (
    kind: K8sKind,
    data: K8sResourceCommon,
    opts,
    enhancedOpts,
  ) => {
    methodsUnchecked.registerKind(kind);
    methodsUnchecked.appendHistory(new HistoryItem(HistoryType.CREATE, data), enhancedOpts);
  };
  // different behaviour than the original - we need to store the testVM
  methodsUnchecked.k8sGet = async (kind: K8sKind, data: K8sResourceCommon, opts, enhancedOpts) => {
    methodsUnchecked.registerKind(kind);
    methodsUnchecked.appendHistory(new HistoryItem(HistoryType.GET, data), enhancedOpts);
  };
  methodsUnchecked.k8sPatch = async (
    kind: K8sKind,
    data: K8sResourceCommon,
    patches: Patch[],
    enhancedOpts,
  ) => {
    methodsUnchecked.registerKind(kind);
    methodsUnchecked.appendHistory(
      new HistoryItem(HistoryType.PATCH, { ...data, ...patches[0] }),
      enhancedOpts,
    );
  };
  methodsUnchecked.k8sKill = async (
    kind: K8sKind,
    data: K8sResourceCommon,
    opts,
    json,
    enhancedOpts,
  ) => {
    methodsUnchecked.registerKind(kind);
    methodsUnchecked.appendHistory(new HistoryItem(HistoryType.DELETE, data), enhancedOpts);
  };
  return { methods, methodsUnchecked };
};

const expectHistory = (history, expectedHistory) => {
  expect(history).toHaveLength(expectedHistory.length);

  expectedHistory.forEach((expectHistoryItem, idx) => {
    expect(history[idx]).toEqual(expectHistoryItem);
  });
};

describe('enhancedK8sMethods.js', () => {
  const testVM = new VMWrapper()
    .setModel(VirtualMachineModel)
    .setName('testVM')
    .setNamespace('default')
    .setMemory('5', 'Gi')
    .asResource();

  const otherTestVM = new VMWrapper()
    .setModel(VirtualMachineModel)
    .setName('otherVM')
    .setNamespace('kube')
    .setMemory('1', 'Mi')
    .asResource();

  const testPatch = new PatchBuilder('/')
    .add({
      additionalData: 'testData',
    })
    .build();

  it('records history and shows actualState', async () => {
    const { methods, methodsUnchecked } = spyEnhancedK8sMethods();

    expect(methods.getHistory()).toHaveLength(0);
    expect(methods.getActualState()).toHaveLength(0);

    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, [testPatch]);
    await methods.k8sKill(VirtualMachineModel, testVM);
    const history = methods.getHistory();

    expectHistory(history, [
      new HistoryItem(HistoryType.CREATE, testVM),
      new HistoryItem(HistoryType.PATCH, { ...testVM, ...testPatch }),
      new HistoryItem(HistoryType.DELETE, testVM),
    ]);

    expect(methodsUnchecked.history).toHaveLength(3);
  });

  it('shows actualState', async () => {
    const { methods, methodsUnchecked } = spyEnhancedK8sMethods();

    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, []);
    await methods.k8sPatch(VirtualMachineModel, testVM, []);
    await methodsUnchecked.k8sGet(VirtualMachineModel, testVM);
    await methods.k8sKill(VirtualMachineModel, testVM);
    await methods.k8sCreate(VirtualMachineModel, otherTestVM);
    await methods.k8sPatch(VirtualMachineModel, otherTestVM, []);
    await methodsUnchecked.k8sGet(VirtualMachineModel, otherTestVM);
    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methodsUnchecked.k8sGet(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, [testPatch]);
    const actualState = methods.getActualState();

    expect(actualState).toHaveLength(2);
    expect(actualState[0]).toEqual(otherTestVM);
    expect(actualState[1]).toEqual({ ...testVM, ...testPatch });
  });

  it('disables recording history', async () => {
    const { methods, methodsUnchecked } = spyEnhancedK8sMethods();

    await methods.k8sCreate(VirtualMachineModel, testVM, null, disableHistoryOpts);
    await methods.k8sPatch(VirtualMachineModel, testVM, [testPatch], disableHistoryOpts);
    await methods.k8sKill(VirtualMachineModel, testVM, null, null, disableHistoryOpts);

    expect(methods.getHistory()).toHaveLength(0);
    expect(methodsUnchecked.history).toHaveLength(0);

    await methods.k8sCreate(VirtualMachineModel, testVM);
    expect(methods.getHistory()).toHaveLength(1);
  });

  it('rollback', async () => {
    const { methods } = spyEnhancedK8sMethods();

    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, []);
    await methods.k8sCreate(VirtualMachineModel, otherTestVM);

    const results = await methods.rollback();

    expect(results).toHaveLength(2);
    expect(methods.getActualState()).toHaveLength(0);

    expectHistory(methods.getHistory(), [
      new HistoryItem(HistoryType.CREATE, testVM),
      new HistoryItem(HistoryType.PATCH, testVM),
      new HistoryItem(HistoryType.CREATE, otherTestVM),
      // reverse order of deletion
      new HistoryItem(HistoryType.DELETE, otherTestVM),
      new HistoryItem(HistoryType.DELETE, testVM),
    ]);
  });

  it('rollback fails', async () => {
    const { methods, methodsUnchecked } = spyEnhancedK8sMethods();
    methodsUnchecked.k8sKill = async () => Promise.reject(new Error('delete failed'));

    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, []);
    await methods.k8sCreate(VirtualMachineModel, otherTestVM);

    expect.assertions(4);
    let rollbackError;
    try {
      await methods.rollback();
    } catch (e) {
      rollbackError = e;
    }
    expect(rollbackError?.message).toEqual('rollback');
    expect(rollbackError?.errors).toHaveLength(2);

    // does not change EnhancedK8sMethods and results
    expect(methods.getActualState()).toHaveLength(2);
    expect(methods.getHistory()).toHaveLength(3);
  });

  it('rollback does not fail on 404', async () => {
    const { methods, methodsUnchecked } = spyEnhancedK8sMethods();
    methodsUnchecked.k8sKill = async (kind: K8sKind, data: K8sResourceCommon) =>
      Promise.reject(new K8sKillError('delete failed', { code: 404 }, data));

    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, []);
    await methods.k8sCreate(VirtualMachineModel, otherTestVM);

    const results = await methods.rollback();
    expect(results).toHaveLength(2);
    expect(methods.getActualState()).toHaveLength(0);

    expectHistory(methods.getHistory(), [
      new HistoryItem(HistoryType.CREATE, testVM),
      new HistoryItem(HistoryType.PATCH, testVM),
      new HistoryItem(HistoryType.CREATE, otherTestVM),
      new HistoryItem(HistoryType.NOT_FOUND, otherTestVM),
      new HistoryItem(HistoryType.NOT_FOUND, testVM),
    ]);
  });
});
