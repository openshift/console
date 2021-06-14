import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { testOperatorGroup, testSubscription } from '../../mocks';
import { OperatorGroupKind, SubscriptionKind, InstallModeType } from '../types';
import {
  requireOperatorGroup,
  NoOperatorGroupMsg,
  supports,
  InstallModeSet,
  installedFor,
  subscriptionFor,
} from './operator-group';

describe('requireOperatorGroup', () => {
  const SomeComponent = () => <div>Requires OperatorGroup</div>;

  it('renders given component if `OperatorGroups` has not loaded yet', () => {
    const WrappedComponent = requireOperatorGroup(SomeComponent);
    const wrapper = shallow(<WrappedComponent operatorGroup={{ loaded: false }} />);

    expect(wrapper.find(SomeComponent).exists()).toBe(true);
    expect(wrapper.find(NoOperatorGroupMsg).exists()).toBe(false);
  });

  it('renders message if no `OperatorGroups` loaded', () => {
    const WrappedComponent = requireOperatorGroup(SomeComponent);
    const wrapper = shallow(<WrappedComponent operatorGroup={{ loaded: true, data: [] }} />);

    expect(wrapper.find(NoOperatorGroupMsg).exists()).toBe(true);
    expect(wrapper.find(SomeComponent).exists()).toBe(false);
  });

  it('renders given component if `OperatorGroups` loaded and present', () => {
    const WrappedComponent = requireOperatorGroup(SomeComponent);
    const wrapper = shallow(
      <WrappedComponent operatorGroup={{ loaded: true, data: [testOperatorGroup] }} />,
    );

    expect(wrapper.find(SomeComponent).exists()).toBe(true);
    expect(wrapper.find(NoOperatorGroupMsg).exists()).toBe(false);
  });
});

describe('subscriptionFor', () => {
  const pkgName = testSubscription.spec.name;
  const ns = testSubscription.metadata.namespace;
  let subscriptions: SubscriptionKind[];
  let operatorGroups: OperatorGroupKind[];

  beforeEach(() => {
    subscriptions = [];
    operatorGroups = [];
  });

  it('returns nothing if no `Subscriptions` exist for the given package', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(subscriptionFor(subscriptions)(operatorGroups)('new-operator')(ns)).toBeUndefined();
  });

  it('returns noting if no `OperatorGroups` target the given namespace', () => {
    subscriptions = [testSubscription];
    operatorGroups = [
      { ...testOperatorGroup, status: { namespaces: ['prod-a', 'prod-b'], lastUpdated: null } },
    ];

    expect(subscriptionFor(subscriptions)(operatorGroups)(pkgName)(ns)).toBeUndefined();
  });

  it('returns nothing if checking for `all-namespaces`', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(subscriptionFor(subscriptions)(operatorGroups)(pkgName)('')).toBeUndefined();
  });

  it('returns `Subscription` when it exists in the "global" `OperatorGroup`', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [''], lastUpdated: null } }];

    expect(subscriptionFor(subscriptions)(operatorGroups)(pkgName)(ns)).toEqual(testSubscription);
  });

  it('returns `Subscription` when it exists in an `OperatorGroup` that targets given namespace', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(subscriptionFor(subscriptions)(operatorGroups)(pkgName)(ns)).toEqual(testSubscription);
  });
});

describe('installedFor', () => {
  const pkgName = testSubscription.spec.name;
  const ns = testSubscription.metadata.namespace;
  let subscriptions: SubscriptionKind[];
  let operatorGroups: OperatorGroupKind[];

  beforeEach(() => {
    subscriptions = [];
    operatorGroups = [];
  });

  it('returns false if no `Subscriptions` exist for the given package', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(installedFor(subscriptions)(operatorGroups)('new-operator')(ns)).toBe(false);
  });

  it('returns false if no `OperatorGroups` target the given namespace', () => {
    subscriptions = [testSubscription];
    operatorGroups = [
      { ...testOperatorGroup, status: { namespaces: ['prod-a', 'prod-b'], lastUpdated: null } },
    ];

    expect(installedFor(subscriptions)(operatorGroups)(pkgName)(ns)).toBe(false);
  });

  it('returns false if checking for `all-namespaces`', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(installedFor(subscriptions)(operatorGroups)(pkgName)('')).toBe(false);
  });

  it('returns true if `Subscription` exists in the "global" `OperatorGroup`', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [''], lastUpdated: null } }];

    expect(installedFor(subscriptions)(operatorGroups)(pkgName)(ns)).toBe(true);
  });

  it('returns true if `Subscription` exists in an `OperatorGroup` that targets given namespace', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(installedFor(subscriptions)(operatorGroups)(pkgName)(ns)).toBe(true);
  });
});

describe('supports', () => {
  let set: InstallModeSet;
  let ownNamespaceGroup: OperatorGroupKind;
  let singleNamespaceGroup: OperatorGroupKind;
  let multiNamespaceGroup: OperatorGroupKind;
  let allNamespacesGroup: OperatorGroupKind;

  beforeEach(() => {
    ownNamespaceGroup = _.cloneDeep(testOperatorGroup);
    ownNamespaceGroup.status = {
      namespaces: [ownNamespaceGroup.metadata.namespace],
      lastUpdated: null,
    };
    singleNamespaceGroup = _.cloneDeep(testOperatorGroup);
    singleNamespaceGroup.status = { namespaces: ['test-ns'], lastUpdated: null };
    multiNamespaceGroup = _.cloneDeep(testOperatorGroup);
    multiNamespaceGroup.status = { namespaces: ['test-ns', 'default'], lastUpdated: null };
    allNamespacesGroup = _.cloneDeep(testOperatorGroup);
    allNamespacesGroup.status = { namespaces: [''], lastUpdated: null };
  });

  it('correctly returns for an Operator that can only run in its own namespace', () => {
    set = [
      { type: InstallModeType.InstallModeTypeOwnNamespace, supported: true },
      { type: InstallModeType.InstallModeTypeSingleNamespace, supported: false },
      { type: InstallModeType.InstallModeTypeMultiNamespace, supported: false },
      { type: InstallModeType.InstallModeTypeAllNamespaces, supported: false },
    ];

    expect(supports(set)(ownNamespaceGroup)).toBe(true);
    expect(supports(set)(singleNamespaceGroup)).toBe(false);
    expect(supports(set)(multiNamespaceGroup)).toBe(false);
    expect(supports(set)(allNamespacesGroup)).toBe(false);
  });

  it('correctly returns for an Operator that can only run in a single namespace', () => {
    set = [
      { type: InstallModeType.InstallModeTypeOwnNamespace, supported: false },
      { type: InstallModeType.InstallModeTypeSingleNamespace, supported: true },
      { type: InstallModeType.InstallModeTypeMultiNamespace, supported: false },
      { type: InstallModeType.InstallModeTypeAllNamespaces, supported: false },
    ];

    expect(supports(set)(ownNamespaceGroup)).toBe(false);
    expect(supports(set)(singleNamespaceGroup)).toBe(true);
    expect(supports(set)(multiNamespaceGroup)).toBe(false);
    expect(supports(set)(allNamespacesGroup)).toBe(false);
  });

  it('correctly returns for an Operator which can run in several namespaces', () => {
    set = [
      { type: InstallModeType.InstallModeTypeOwnNamespace, supported: true },
      { type: InstallModeType.InstallModeTypeSingleNamespace, supported: true },
      { type: InstallModeType.InstallModeTypeMultiNamespace, supported: true },
      { type: InstallModeType.InstallModeTypeAllNamespaces, supported: false },
    ];

    expect(supports(set)(ownNamespaceGroup)).toBe(true);
    expect(supports(set)(singleNamespaceGroup)).toBe(true);
    expect(supports(set)(multiNamespaceGroup)).toBe(true);
    expect(supports(set)(allNamespacesGroup)).toBe(false);
  });

  it('correctly returns for an Operator which can only run in all namespaces', () => {
    set = [
      { type: InstallModeType.InstallModeTypeOwnNamespace, supported: false },
      { type: InstallModeType.InstallModeTypeSingleNamespace, supported: false },
      { type: InstallModeType.InstallModeTypeMultiNamespace, supported: false },
      { type: InstallModeType.InstallModeTypeAllNamespaces, supported: true },
    ];

    expect(supports(set)(ownNamespaceGroup)).toBe(false);
    expect(supports(set)(singleNamespaceGroup)).toBe(false);
    expect(supports(set)(multiNamespaceGroup)).toBe(false);
    expect(supports(set)(allNamespacesGroup)).toBe(true);
  });
});
