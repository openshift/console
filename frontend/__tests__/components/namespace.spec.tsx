import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import Spy = jasmine.Spy;

// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import {
  PullSecret,
  useNamespaceExist,
  NamespaceNotFoundError,
} from '../../public/components/namespace';
import * as k8s from '../../public/module/k8s';
import { LoadingInline } from '../../public/components/utils';
import { testNamespace } from '../../__mocks__/k8sResourcesMocks';
import { NamespaceModel, ProjectModel, ServiceAccountModel } from '../../public/models';
import { testHook } from '../utils/hooks-utils';
import { K8sResourceKind } from '../../public/module/k8s';

jest.mock('react-redux', () => ({
  ...require.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  ...require.requireActual('@console/internal/components/utils/k8s-watch-hook'),
  useK8sWatchResource: jest.fn(),
}));

const useSelectorMock = useSelector as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

describe('PullSecret', () => {
  let wrapper: ReactWrapper;

  const spyAndExpect = (spy: Spy) => (returnValue: any) =>
    new Promise((resolve) =>
      spy.and.callFake((...args) => {
        resolve(args);
        return returnValue;
      }),
    );

  it('renders link to open modal once pull secrets are loaded', (done) => {
    spyAndExpect(spyOn(k8s, 'k8sGet'))(Promise.resolve({ items: [] }))
      .then(([model, name, namespace, options]) => {
        expect(model).toEqual(ServiceAccountModel);
        expect(name).toBe('default');
        expect(namespace).toEqual(testNamespace.metadata.name);

        expect(options).toEqual({});
      })
      .then(() => {
        wrapper.update();
        expect(wrapper.find('button').exists()).toBe(true);
        done();
      });

    wrapper = mount(<PullSecret namespace={testNamespace} canViewSecrets={false} />);
  });

  it('does not render link if still loading', () => {
    spyOn(k8s, 'k8sGet').and.returnValue(Promise.resolve({ items: [] }));
    wrapper = mount(<PullSecret namespace={testNamespace} canViewSecrets={false} />);

    expect(wrapper.find(LoadingInline).exists()).toBe(true);
  });
});

describe('useNamespaceExist', () => {
  beforeEach(() => {
    useSelectorMock.mockClear();
    useK8sWatchResourceMock.mockClear();
  });

  it('should return exist=true when namespace parameter is not defined, should not watch any resource', () => {
    useSelectorMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([undefined, true, undefined]);

    const { result } = testHook(() => useNamespaceExist(null));

    expect(result.current).toEqual([true, true, undefined]);
    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock.mock.calls[0]).toEqual([null]);
  });

  it('should return exist=true when namespace is part of the project list', () => {
    useSelectorMock.mockReturnValue(true);
    const allProjects: K8sResourceKind[] = [
      {
        apiVersion: ProjectModel.apiVersion,
        kind: ProjectModel.kind,
        metadata: { name: 'existing-project' },
      },
    ];
    useK8sWatchResourceMock.mockReturnValue([allProjects, true, undefined]);

    const { result } = testHook(() => useNamespaceExist('existing-project'));

    expect(result.current).toEqual([true, true, undefined]);
    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock.mock.calls[0]).toEqual([
      { isList: true, kind: ProjectModel.kind, optional: true },
    ]);
  });

  it('should return exist=true when namespace is part of the namespace list', () => {
    useSelectorMock.mockReturnValue(false);
    const allNamespaces: K8sResourceKind[] = [
      {
        apiVersion: NamespaceModel.apiVersion,
        kind: NamespaceModel.kind,
        metadata: { name: 'existing-namespace' },
      },
    ];
    useK8sWatchResourceMock.mockReturnValue([allNamespaces, true, undefined]);

    const { result } = testHook(() => useNamespaceExist('existing-namespace'));

    expect(result.current).toEqual([true, true, undefined]);
    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock.mock.calls[0]).toEqual([
      { isList: true, kind: NamespaceModel.kind, optional: true },
    ]);
  });

  it('should return exist=false when namespace is not part of the project list', () => {
    useSelectorMock.mockReturnValue(true);
    const allNamespaces: K8sResourceKind[] = [
      {
        apiVersion: ProjectModel.apiVersion,
        kind: ProjectModel.kind,
        metadata: { name: 'existing-project' },
      },
    ];
    useK8sWatchResourceMock.mockReturnValue([allNamespaces, true, undefined]);

    const { result } = testHook(() => useNamespaceExist('missing-namespace'));

    expect(result.current).toEqual([false, true, undefined]);
    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock.mock.calls[0]).toEqual([
      { isList: true, kind: ProjectModel.kind, optional: true },
    ]);
  });

  it('should return exist=false when namespace is not part of the namespace list', () => {
    useSelectorMock.mockReturnValue(true);
    const allNamespaces: K8sResourceKind[] = [
      {
        apiVersion: NamespaceModel.apiVersion,
        kind: NamespaceModel.kind,
        metadata: { name: 'existing-namespace' },
      },
    ];
    useK8sWatchResourceMock.mockReturnValue([allNamespaces, true, undefined]);

    const { result } = testHook(() => useNamespaceExist('missing-namespace'));

    expect(result.current).toEqual([false, true, undefined]);
    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock.mock.calls[0]).toEqual([
      { isList: true, kind: ProjectModel.kind, optional: true },
    ]);
  });

  it('should return exist=true when API call fails', () => {
    useSelectorMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([[], true, new Error('Network error')]);

    const { result } = testHook(() => useNamespaceExist('doesnt-matter'));

    expect(result.current).toEqual([true, true, new Error('Network error')]);
    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock.mock.calls[0]).toEqual([
      { isList: true, kind: ProjectModel.kind, optional: true },
    ]);
  });
});

describe('NamespaceNotFoundError', () => {
  it('should render 404 Project not found if projects are used', () => {
    useSelectorMock.mockReturnValue(true);
    const wrapper = mount(<NamespaceNotFoundError />);
    expect(wrapper.text()).toEqual('404: Project not found');
  });

  it('should render 404 Namespace not found if projects are not used', () => {
    useSelectorMock.mockReturnValue(false);
    const wrapper = mount(<NamespaceNotFoundError />);
    expect(wrapper.text()).toEqual('404: Namespace not found');
  });
});
