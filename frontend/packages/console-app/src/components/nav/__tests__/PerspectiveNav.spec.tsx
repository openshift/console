import { Nav } from '@patternfly/react-core';
import { screen, configure } from '@testing-library/react';
import { usePinnedResources } from '@console/shared/src/hooks/usePinnedResources';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import PerspectiveNav from '../PerspectiveNav';

jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn(() => ['dev', jest.fn()]),
}));

jest.mock('@console/shared/src/hooks/usePinnedResources', () => ({
  usePinnedResources: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/perspective-utils', () => ({
  usePerspectives: jest.fn(),
}));

jest.mock('../useNavExtensionForPerspective', () => ({
  useNavExtensionsForPerspective: jest.fn(() => []),
}));

jest.mock('react-dnd', () => ({
  ...jest.requireActual('react-dnd'),
  useDrag: jest.fn(() => [{}, jest.fn(), jest.fn()]),
  useDrop: jest.fn(() => [{}, jest.fn()]),
}));

const mockK8sModel = {
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
};

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: jest.fn(() => [mockK8sModel, false]),
}));

describe('Perspective Nav', () => {
  const setupPinnedResources = (resources: string[]) => {
    (usePinnedResources as jest.Mock).mockReturnValue([resources, jest.fn(), true]);
  };

  const renderPerspectiveNav = () => {
    return renderWithProviders(
      <Nav>
        <PerspectiveNav />
      </Nav>,
    );
  };

  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dev perspective nav with proper accessibility', () => {
    setupPinnedResources(['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig']);
    renderPerspectiveNav();

    expect(screen.getByRole('region', { name: 'Pinned resources' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'ConfigMaps' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'BuildConfigs' })).toBeVisible();
  });

  it('should render non-draggable pinned items when only one pinned resource is available', () => {
    setupPinnedResources(['core~v1~ConfigMap']);
    renderPerspectiveNav();

    expect(screen.getByRole('link', { name: 'ConfigMaps' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Drag to reorder' })).not.toBeInTheDocument();
  });

  it('should render draggable pinned items when more than one pinned resource is available', () => {
    setupPinnedResources(['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig']);
    renderPerspectiveNav();

    const dragButtons = screen.getAllByRole('button', { name: 'Drag to reorder' });
    expect(dragButtons).toHaveLength(2);
    dragButtons.forEach((button) => expect(button).toBeVisible());

    expect(screen.getByRole('link', { name: 'ConfigMaps' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'BuildConfigs' })).toBeVisible();
  });

  it('should handle one valid and one invalid pinned resource', () => {
    setupPinnedResources(['core~v1~ConfigMap', 'foo']);
    renderPerspectiveNav();

    expect(screen.getByRole('link', { name: 'ConfigMaps' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Drag to reorder' })).not.toBeInTheDocument();
  });

  it('should handle multiple valid and one invalid pinned resource', () => {
    setupPinnedResources(['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig', 'foo']);
    renderPerspectiveNav();

    const dragButtons = screen.getAllByRole('button', { name: 'Drag to reorder' });
    expect(dragButtons).toHaveLength(2);
    dragButtons.forEach((button) => expect(button).toBeVisible());

    expect(screen.getByRole('link', { name: 'ConfigMaps' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'BuildConfigs' })).toBeVisible();
  });

  it('should handle one valid and multiple invalid pinned resources', () => {
    setupPinnedResources(['core~v1~ConfigMap', 'foo', 'bar', 'baz']);
    renderPerspectiveNav();

    expect(screen.getByRole('link', { name: 'ConfigMaps' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Drag to reorder' })).not.toBeInTheDocument();
  });

  it('should handle multiple valid and multiple invalid pinned resources', () => {
    setupPinnedResources([
      'core~v1~ConfigMap',
      'build.openshift.io~v1~BuildConfig',
      'foo',
      'bar',
      'baz',
    ]);
    renderPerspectiveNav();

    const dragButtons = screen.getAllByRole('button', { name: 'Drag to reorder' });
    expect(dragButtons).toHaveLength(2);
    dragButtons.forEach((button) => expect(button).toBeVisible());

    expect(screen.getByRole('link', { name: 'ConfigMaps' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'BuildConfigs' })).toBeVisible();
  });

  it('should handle all invalid pinned resources', () => {
    setupPinnedResources(['foo', 'bar', 'baz']);
    renderPerspectiveNav();

    expect(screen.queryByRole('link', { name: 'ConfigMaps' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Drag to reorder' })).not.toBeInTheDocument();
  });
});
