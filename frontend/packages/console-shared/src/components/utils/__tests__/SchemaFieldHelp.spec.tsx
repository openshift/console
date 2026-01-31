import { screen } from '@testing-library/react';
import { K8sKind } from '@console/internal/module/k8s';
import * as k8s from '@console/internal/module/k8s';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { SchemaFieldHelp } from '../SchemaFieldHelp';

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  getPropertyDescription: jest.fn(),
}));

const mockGetPropertyDescription = k8s.getPropertyDescription as jest.Mock;

describe('SchemaFieldHelp', () => {
  const mockModel: K8sKind = {
    kind: 'TestKind',
    label: 'Test Kind',
    labelPlural: 'Test Kinds',
    apiVersion: 'v1',
    apiGroup: 'test.io',
    plural: 'testkinds',
    abbr: 'TK',
    namespaced: true,
    id: 'testkind',
  };

  const props = {
    model: mockModel,
    propertyPath: 'spec.test',
    headerContent: 'Test Field',
    ariaLabel: 'Test field help',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render help icon when description is available from schema', () => {
    mockGetPropertyDescription.mockReturnValue('This is a test description from schema');

    renderWithProviders(<SchemaFieldHelp {...props} />);

    const helpButton = screen.getByRole('button', { name: 'Test field help' });
    expect(helpButton).toBeInTheDocument();
  });

  it('should render help icon when fallback description is provided', () => {
    mockGetPropertyDescription.mockReturnValue(null);

    renderWithProviders(
      <SchemaFieldHelp {...props} fallbackDescription="This is a fallback description" />,
    );

    const helpButton = screen.getByRole('button', { name: 'Test field help' });
    expect(helpButton).toBeInTheDocument();
  });

  it('should not render when no description is available', () => {
    mockGetPropertyDescription.mockReturnValue(null);

    renderWithProviders(<SchemaFieldHelp {...props} />);

    const helpButton = screen.queryByRole('button', { name: 'Test field help' });
    expect(helpButton).not.toBeInTheDocument();
  });

  it('should prioritize schema description over fallback', () => {
    const schemaDescription = 'Schema description';
    const fallbackDescription = 'Fallback description';
    mockGetPropertyDescription.mockReturnValue(schemaDescription);

    renderWithProviders(<SchemaFieldHelp {...props} fallbackDescription={fallbackDescription} />);

    const helpButton = screen.getByRole('button', { name: 'Test field help' });
    expect(helpButton).toBeInTheDocument();
    // Verify that getPropertyDescription was called
    expect(mockGetPropertyDescription).toHaveBeenCalledWith(mockModel, 'spec.test');
  });

  it('should handle array property paths', () => {
    mockGetPropertyDescription.mockReturnValue('Description for nested path');

    renderWithProviders(<SchemaFieldHelp {...props} propertyPath={['spec', 'nested', 'path']} />);

    const helpButton = screen.getByRole('button', { name: 'Test field help' });
    expect(helpButton).toBeInTheDocument();
    expect(mockGetPropertyDescription).toHaveBeenCalledWith(mockModel, ['spec', 'nested', 'path']);
  });
});
