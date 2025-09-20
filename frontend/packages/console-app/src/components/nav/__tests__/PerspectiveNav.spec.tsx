import { Nav } from '@patternfly/react-core';
import { screen, configure } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePinnedResources } from '@console/shared/src/hooks/usePinnedResources';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import PerspectiveNav from '../PerspectiveNav';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));
jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn().mockReturnValue(['dev', jest.fn()]),
}));
jest.mock('@console/shared/src/hooks/usePinnedResources', () => ({
  usePinnedResources: jest.fn(),
}));
jest.mock('@console/shared/src/hooks/perspective-utils', () => ({
  usePerspectives: jest.fn(),
}));
jest.mock('../useNavExtensionForPerspective', () => ({
  useNavExtensionsForPerspective: jest.fn().mockReturnValue([]),
}));
jest.mock('react-dnd', () => {
  const reactDnd = jest.requireActual('react-dnd');
  return {
    ...reactDnd,
    useDrag: jest.fn().mockReturnValue([{}, {}, jest.fn()]),
    useDrop: jest.fn().mockReturnValue([{}, jest.fn()]),
  };
});
jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: jest.fn().mockReturnValue([
    {
      apiVersion: 'v1',
      label: 'Test',
      labelKey: 'public~Test',
      plural: 'tests',
      abbr: 'T',
      namespaced: true,
      kind: 'Test',
      id: 'test',
      labelPlural: 'Tests',
      labelPluralKey: 'public~Tests',
    },
    false,
  ]),
}));

describe('Perspective Nav', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  it('should render dev perspective nav with proper accessibility', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig'],
      jest.fn(),
      true,
    ]);
    renderWithProviders(<PerspectiveNav />);

    // Test for the actual rendered component structure
    expect(screen.getByTestId('dev-perspective-nav')).toBeInTheDocument();
    expect(screen.getByTestId('dev-perspective-nav')).toBeVisible();

    // Verify navigation functionality is accessible
    const navigation = screen.getByRole('navigation', { name: /main navigation/i });
    expect(navigation).toBeInTheDocument();
    expect(navigation).toHaveClass('oc-perspective-nav');
  });

  it('should render non-draggable pinned items when only one pinned resource is available', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([['core~v1~ConfigMap'], jest.fn(), true]);
    renderWithProviders(
      <Nav>
        <PerspectiveNav />
      </Nav>,
    );
    // Verify the pinned resource item is rendered correctly
    expect(screen.getByTestId('pinned-resource-item')).toBeInTheDocument();
    expect(screen.getByTestId('pinned-resource-item')).toBeVisible();
    // Verify no draggable items when only one resource
    expect(screen.queryByTestId('draggable-pinned-resource-item')).not.toBeInTheDocument();
  });

  it('should render draggable pinned items when more than one pinned resource is available', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig'],
      jest.fn(),
      true,
    ]);
    renderWithProviders(
      <Nav>
        <PerspectiveNav />
      </Nav>,
    );
    // Verify draggable behavior is enabled for multiple items
    const draggableItems = screen.getAllByTestId('draggable-pinned-resource-item');
    expect(draggableItems).toHaveLength(2);
    draggableItems.forEach((item) => expect(item).toBeVisible());
    // Verify no non-draggable items when multiple resources
    expect(screen.queryByTestId('pinned-resource-item')).not.toBeInTheDocument();
  });

  it('should handle one valid and one invalid pinned resource', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'foo'],
      jest.fn(),
      true,
    ]);
    renderWithProviders(
      <Nav>
        <PerspectiveNav />
      </Nav>,
    );
    // Verify single valid resource renders as non-draggable
    expect(screen.getByTestId('pinned-resource-item')).toBeInTheDocument();
    expect(screen.getByTestId('pinned-resource-item')).toBeVisible();
    expect(screen.queryByTestId('draggable-pinned-resource-item')).not.toBeInTheDocument();
  });

  it('should handle one valid and multiple invalid pinned resources', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'foo', 'bar', 'baz'],
      jest.fn(),
      true,
    ]);
    renderWithProviders(
      <Nav>
        <PerspectiveNav />
      </Nav>,
    );
    // Verify single valid resource renders as non-draggable
    expect(screen.getByTestId('pinned-resource-item')).toBeInTheDocument();
    expect(screen.getByTestId('pinned-resource-item')).toBeVisible();
    expect(screen.queryByTestId('draggable-pinned-resource-item')).not.toBeInTheDocument();
  });

  it('should handle multiple valid and one invalid pinned resource', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig', 'foo'],
      jest.fn(),
      true,
    ]);
    renderWithProviders(
      <Nav>
        <PerspectiveNav />
      </Nav>,
    );
    // Verify multiple valid resources render as draggable
    expect(screen.queryByTestId('pinned-resource-item')).not.toBeInTheDocument();
    const draggableItems = screen.getAllByTestId('draggable-pinned-resource-item');
    expect(draggableItems).toHaveLength(2);
    draggableItems.forEach((item) => expect(item).toBeVisible());
  });

  it('should handle multiple valid and multiple invalid pinned resources', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig', 'foo', 'bar', 'baz'],
      jest.fn(),
      true,
    ]);
    renderWithProviders(
      <Nav>
        <PerspectiveNav />
      </Nav>,
    );
    // Verify multiple valid resources render as draggable
    expect(screen.queryByTestId('pinned-resource-item')).not.toBeInTheDocument();
    const draggableItems = screen.getAllByTestId('draggable-pinned-resource-item');
    expect(draggableItems).toHaveLength(2);
    draggableItems.forEach((item) => expect(item).toBeVisible());
  });

  it('should handle all invalid pinned resources', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([['foo', 'bar', 'baz'], jest.fn(), true]);
    renderWithProviders(
      <Nav>
        <PerspectiveNav />
      </Nav>,
    );
    // Verify no resources are rendered when all are invalid
    expect(screen.queryByTestId('pinned-resource-item')).not.toBeInTheDocument();
    expect(screen.queryByTestId('draggable-pinned-resource-item')).not.toBeInTheDocument();
  });

  // TODO: More unit tests for dynmamic plugins
});
