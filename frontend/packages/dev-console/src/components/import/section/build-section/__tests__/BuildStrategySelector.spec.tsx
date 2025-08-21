import { configure, render, screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import * as shipwrightHooks from '@console/dev-console/src/utils/shipwright-build-hook';
import { BuildStrategySelector } from '../BuildStrategySelector';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

const spySWClusterBuildStrategy = jest.spyOn(shipwrightHooks, 'useClusterBuildStrategy');

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

jest.mock('@console/shared/src', () => ({
  SingleDropdownField: () => 'SingleDropdownField',
  SelectInputOption: {},
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingInline: () => 'Loading...',
}));

jest.mock('@console/git-service/src', () => ({
  ImportStrategy: {
    DOCKERFILE: 1,
    S2I: 0,
  },
}));

jest.mock('@console/shipwright-plugin/src/types', () => ({
  ClusterBuildStrategy: {
    BUILDAH: 'buildah',
    S2I: 'source-to-image',
  },
  ReadableClusterBuildStrategies: {
    buildah: 'Buildah',
    'source-to-image': 'Source-to-Image',
  },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'devconsole~Cluster Build Strategy') return 'Cluster Build Strategy';
      if (key === 'devconsole~Select Cluster Build Strategy')
        return 'Select Cluster Build Strategy';
      if (key === 'Buildah') return 'Buildah';
      if (key === 'Source-to-Image') return 'Source-to-Image';
      return key;
    },
  }),
}));

describe('BuildStrategySelector', () => {
  beforeEach(() => {
    (useFormikContext as jest.Mock).mockReturnValue({
      setFieldValue: jest.fn(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not render SingleDropdownField if clusterBuildStrategy is not loaded', () => {
    spySWClusterBuildStrategy.mockReturnValue([{}, false]);

    render(<BuildStrategySelector formType="create" importStrategy={0} />);

    expect(screen.queryByText(/SingleDropdownField/)).not.toBeInTheDocument();
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  it('should render SingleDropdownField when clusterBuildStrategy is loaded', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);

    render(<BuildStrategySelector formType="create" importStrategy={0} />);

    expect(screen.getByText(/SingleDropdownField/)).toBeInTheDocument();
  });

  it('should render SingleDropdownField for buildah strategy', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ buildah: true }, true]);

    render(<BuildStrategySelector formType="create" importStrategy={1} />);

    expect(screen.getByText(/SingleDropdownField/)).toBeInTheDocument();
  });

  it('should render SingleDropdownField even when buildah strategy is not found', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ buildah: false }, true]);

    render(<BuildStrategySelector formType="create" importStrategy={1} />);

    expect(screen.getByText(/SingleDropdownField/)).toBeInTheDocument();
  });

  it('should render SingleDropdownField even when s2i strategy is not found', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: false }, true]);

    render(<BuildStrategySelector formType="create" importStrategy={0} />);

    expect(screen.getByText(/SingleDropdownField/)).toBeInTheDocument();
  });

  it('should render SingleDropdownField when loaded', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);

    render(<BuildStrategySelector formType="create" importStrategy={0} />);

    expect(screen.getByText(/SingleDropdownField/)).toBeInTheDocument();
  });

  it('should render SingleDropdownField when formType is edit', () => {
    spySWClusterBuildStrategy.mockReturnValue([{ s2i: true }, true]);

    render(<BuildStrategySelector formType="edit" importStrategy={0} />);

    expect(screen.getByText(/SingleDropdownField/)).toBeInTheDocument();
  });
});
