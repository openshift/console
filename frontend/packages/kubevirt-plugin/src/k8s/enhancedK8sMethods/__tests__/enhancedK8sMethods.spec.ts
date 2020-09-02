import { EnhancedK8sMethods } from '../enhancedK8sMethods';
import { HistoryItem, HistoryType } from '../types';

import { VirtualMachineModel } from '../../../models';
import { VMWrapper } from '../../wrapper/vm/vm-wrapper';
import { PatchBuilder } from '@console/shared/src/k8s';
import { K8sKind, K8sResourceCommon, Patch } from '@console/internal/module/k8s';
import { K8sKillError } from '../errors';

const disableHistoryOpts = { disableHistory: true };

const spyEnhancedK8sMethods = () => {
  const methods: EnhancedK8sMethods & {
    mockK8sGet?: (kind: K8sKind, data: K8sResourceCommon, opts?, enhancedOpts?) => void;
  } = new EnhancedK8sMethods();
  const methodsUnchecked = methods as any;
  // mocks the approximate behaviour of CRUD methods
  // different behaviour than the original - we need to store the testVM
  methods.mockK8sGet = async (kind: K8sKind, data: K8sResourceCommon, opts, enhancedOpts) => {
    methodsUnchecked.registerKind(kind);
    methodsUnchecked.appendHistory(new HistoryItem(HistoryType.GET, data), enhancedOpts);
  };
  methodsUnchecked.k8sCreate = async (
    kind: K8sKind,
    data: K8sResourceCommon,
    opts,
    enhancedOpts,
  ) => {
    methodsUnchecked.registerKind(kind);
    methodsUnchecked.appendHistory(new HistoryItem(HistoryType.CREATE, data), enhancedOpts);
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
  return methods;
};

describe('enhancedK8sMethods', () => {
  const testVM = new VMWrapper()
    .init()
    .setName('testVM')
    .setNamespace('default')
    .setMemory('5', 'Gi')
    .asResource();

  const otherTestVM = new VMWrapper()
    .init()
    .setName('otherVM')
    .setNamespace('kube')
    .setMemory('1', 'Mi')
    .asResource();

  const testPatch = new PatchBuilder('/')
    .add({
      additionalData: 'testData',
    })
    .build();

  it('records history', async () => {
    const methods = spyEnhancedK8sMethods();

    expect(methods.getHistory()).toHaveLength(0);

    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, [testPatch]);
    await methods.k8sKill(VirtualMachineModel, testVM);
    const history = methods.getHistory();

    expect(history).toHaveLength(3);
    expect(history).toEqual([
      new HistoryItem(HistoryType.CREATE, testVM),
      new HistoryItem(HistoryType.PATCH, { ...testVM, ...testPatch }),
      new HistoryItem(HistoryType.DELETE, testVM),
    ]);
  });

  it('shows actualState', async () => {
    const methods = spyEnhancedK8sMethods();

    expect(methods.getActualState()).toHaveLength(0);

    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, []);
    await methods.k8sPatch(VirtualMachineModel, testVM, []);
    await methods.mockK8sGet(VirtualMachineModel, testVM);
    await methods.k8sKill(VirtualMachineModel, testVM);
    await methods.k8sCreate(VirtualMachineModel, otherTestVM);
    await methods.k8sPatch(VirtualMachineModel, otherTestVM, []);
    await methods.mockK8sGet(VirtualMachineModel, otherTestVM);
    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methods.mockK8sGet(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, [testPatch]);
    const actualState = methods.getActualState();

    expect(actualState).toHaveLength(2);
    expect(actualState[0]).toEqual(otherTestVM);
    expect(actualState[1]).toEqual({ ...testVM, ...testPatch });
  });

  it('disables recording history', async () => {
    const methods = spyEnhancedK8sMethods();

    await methods.k8sCreate(VirtualMachineModel, testVM, null, disableHistoryOpts);
    await methods.k8sPatch(VirtualMachineModel, testVM, [testPatch], disableHistoryOpts);
    await methods.k8sKill(VirtualMachineModel, testVM, null, null, disableHistoryOpts);

    expect(methods.getHistory()).toHaveLength(0);

    await methods.k8sCreate(VirtualMachineModel, testVM);
    expect(methods.getHistory()).toHaveLength(1);
  });

  it('rollback', async () => {
    const methods = spyEnhancedK8sMethods();

    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, []);
    await methods.k8sCreate(VirtualMachineModel, otherTestVM);

    const results = await methods.rollback();

    expect(results).toHaveLength(2);
    expect(methods.getActualState()).toHaveLength(0);

    expect(methods.getHistory()).toEqual([
      new HistoryItem(HistoryType.CREATE, testVM),
      new HistoryItem(HistoryType.PATCH, testVM),
      new HistoryItem(HistoryType.CREATE, otherTestVM),
      // reverse order of deletion
      new HistoryItem(HistoryType.DELETE, otherTestVM),
      new HistoryItem(HistoryType.DELETE, testVM),
    ]);
  });

  it('rollback fails', async () => {
    const methods = spyEnhancedK8sMethods();
    (methods as any).k8sKill = async () => Promise.reject(new Error('delete failed'));

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
    expect(rollbackError?.errors).toEqual([
      new K8sKillError('delete failed', undefined, testVM),
      new K8sKillError('delete failed', undefined, otherTestVM),
    ]);

    // does not change EnhancedK8sMethods and results
    expect(methods.getActualState()).toHaveLength(2);
    expect(methods.getHistory()).toHaveLength(3);
  });

  it('rollback does not fail on 404', async () => {
    const methods = spyEnhancedK8sMethods();
    (methods as any).k8sKill = async (kind: K8sKind, data: K8sResourceCommon) =>
      Promise.reject(
        new K8sKillError(
          'delete failed',
          { message: 'delete failed', json: { code: 404 } } as any,
          data,
        ),
      );

    await methods.k8sCreate(VirtualMachineModel, testVM);
    await methods.k8sPatch(VirtualMachineModel, testVM, []);
    await methods.k8sCreate(VirtualMachineModel, otherTestVM);

    const results = await methods.rollback();
    expect(results).toHaveLength(2);
    expect(methods.getActualState()).toHaveLength(0);

    expect(methods.getHistory()).toEqual([
      new HistoryItem(HistoryType.CREATE, testVM),
      new HistoryItem(HistoryType.PATCH, testVM),
      new HistoryItem(HistoryType.CREATE, otherTestVM),
      new HistoryItem(HistoryType.NOT_FOUND, otherTestVM),
      new HistoryItem(HistoryType.NOT_FOUND, testVM),
    ]);
  });
});
