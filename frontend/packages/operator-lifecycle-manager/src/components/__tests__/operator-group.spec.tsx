import { screen } from '@testing-library/react';
import * as _ from 'lodash';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  testOperatorGroup,
  testSubscription,
  testPackageManifest,
  dummyPackageManifest,
} from '../../../mocks';
import type { OperatorGroupKind, SubscriptionKind } from '../../types';
import { InstallModeType } from '../../types';
import type { InstallModeSet } from '../operator-group';
import { requireOperatorGroup, supports, installedFor, subscriptionFor } from '../operator-group';

describe('requireOperatorGroup', () => {
  const SomeComponent = () => <div>Requires OperatorGroup</div>;

  it('renders given component if OperatorGroups has not loaded yet', () => {
    const WrappedComponent = requireOperatorGroup(SomeComponent);

    renderWithProviders(<WrappedComponent operatorGroup={{ loaded: false }} />);

    expect(screen.getByText('Requires OperatorGroup')).toBeVisible();
    expect(screen.queryByText('Namespace not enabled')).not.toBeInTheDocument();
  });

  it('renders message if no OperatorGroups loaded', () => {
    const WrappedComponent = requireOperatorGroup(SomeComponent);

    renderWithProviders(<WrappedComponent operatorGroup={{ loaded: true, data: [] }} />);

    expect(screen.getByText('Namespace not enabled')).toBeVisible();
    expect(screen.queryByText('Requires OperatorGroup')).not.toBeInTheDocument();
  });

  it('renders given component if OperatorGroups loaded and present', () => {
    const WrappedComponent = requireOperatorGroup(SomeComponent);

    renderWithProviders(
      <WrappedComponent operatorGroup={{ loaded: true, data: [testOperatorGroup] }} />,
    );

    expect(screen.getByText('Requires OperatorGroup')).toBeVisible();
    expect(screen.queryByText('Namespace not enabled')).not.toBeInTheDocument();
  });
});

describe('subscriptionFor', () => {
  const pkg = testPackageManifest;
  const ns = testSubscription.metadata.namespace;
  let subscriptions: SubscriptionKind[];
  let operatorGroups: OperatorGroupKind[];

  beforeEach(() => {
    subscriptions = [];
    operatorGroups = [];
  });

  it('returns nothing if no Subscriptions exist for the given package', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(
      subscriptionFor(subscriptions)(operatorGroups)(dummyPackageManifest)(ns),
    ).toBeUndefined();
  });

  it('returns nothing if no OperatorGroups target the given namespace', () => {
    subscriptions = [testSubscription];
    operatorGroups = [
      { ...testOperatorGroup, status: { namespaces: ['prod-a', 'prod-b'], lastUpdated: null } },
    ];

    expect(subscriptionFor(subscriptions)(operatorGroups)(pkg)(ns)).toBeUndefined();
  });

  it('returns nothing if no Subscriptions share the package namespace', () => {
    subscriptions = [testSubscription];
    operatorGroups = [
      { ...testOperatorGroup, status: { namespaces: ['prod-a', 'prod-b'], lastUpdated: null } },
    ];

    expect(
      subscriptionFor(subscriptions)(operatorGroups)(dummyPackageManifest)(ns),
    ).toBeUndefined();
  });

  it('returns nothing if no Subscriptions share the package catalog source', () => {
    subscriptions = [testSubscription];
    operatorGroups = [
      { ...testOperatorGroup, status: { namespaces: ['prod-a', 'prod-b'], lastUpdated: null } },
    ];

    expect(
      subscriptionFor(subscriptions)(operatorGroups)(dummyPackageManifest)(ns),
    ).toBeUndefined();
  });

  it('returns nothing if checking for all-namespaces', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(subscriptionFor(subscriptions)(operatorGroups)(pkg)('')).toBeUndefined();
  });

  it('returns Subscription when it exists in the global OperatorGroup', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [''], lastUpdated: null } }];

    expect(subscriptionFor(subscriptions)(operatorGroups)(pkg)(ns)).toEqual(testSubscription);
  });

  it('returns Subscription when it exists in an OperatorGroup that targets given namespace', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(subscriptionFor(subscriptions)(operatorGroups)(pkg)(ns)).toEqual(testSubscription);
  });
});

describe('installedFor', () => {
  const pkg = testPackageManifest;
  const ns = testSubscription.metadata.namespace;
  let subscriptions: SubscriptionKind[];
  let operatorGroups: OperatorGroupKind[];

  beforeEach(() => {
    subscriptions = [];
    operatorGroups = [];
  });

  it('returns false if no Subscriptions exist for the given package', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(installedFor(subscriptions)(operatorGroups)(dummyPackageManifest)(ns)).toBe(false);
  });

  it('returns false if no OperatorGroups target the given namespace', () => {
    subscriptions = [testSubscription];
    operatorGroups = [
      { ...testOperatorGroup, status: { namespaces: ['prod-a', 'prod-b'], lastUpdated: null } },
    ];

    expect(installedFor(subscriptions)(operatorGroups)(pkg)(ns)).toBe(false);
  });

  it('returns false if checking for all-namespaces', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(installedFor(subscriptions)(operatorGroups)(pkg)('')).toBe(false);
  });

  it('returns false if Subscription is in a different namespace than the given package', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(installedFor(subscriptions)(operatorGroups)(dummyPackageManifest)(ns)).toBe(false);
  });

  it('returns false if Subscription is from a different catalog source than the given package', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(installedFor(subscriptions)(operatorGroups)(dummyPackageManifest)(ns)).toBe(false);
  });

  it('returns true if Subscription exists in the global OperatorGroup', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [''], lastUpdated: null } }];

    expect(installedFor(subscriptions)(operatorGroups)(pkg)(ns)).toBe(true);
  });

  it('returns true if Subscription exists in an OperatorGroup that targets given namespace', () => {
    subscriptions = [testSubscription];
    operatorGroups = [{ ...testOperatorGroup, status: { namespaces: [ns], lastUpdated: null } }];

    expect(installedFor(subscriptions)(operatorGroups)(pkg)(ns)).toBe(true);
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
