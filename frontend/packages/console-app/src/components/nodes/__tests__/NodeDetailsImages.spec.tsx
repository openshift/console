import { render, screen } from '@testing-library/react';
import type { NodeKind } from '@console/internal/module/k8s';
import NodeDetailsImages from '../NodeDetailsImages';

jest.mock('@console/internal/components/utils/headings', () => ({
  SectionHeading: jest.fn(({ text }: { text: string }) => text),
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: jest.fn(({ children }: { children: React.ReactNode }) => children),
}));

describe('NodeDetailsImages', () => {
  const createMockNode = (images: any[] = []): NodeKind =>
    ({
      apiVersion: 'v1',
      kind: 'Node',
      metadata: {
        name: 'test-node',
      },
      status: {
        images,
      },
    } as NodeKind);

  it('should render section heading', () => {
    const node = createMockNode([]);
    render(<NodeDetailsImages node={node} />);

    expect(screen.getByText('Images')).toBeVisible();
  });

  it('should render a PatternFly table with correct column headers', () => {
    const node = createMockNode([]);
    render(<NodeDetailsImages node={node} />);

    expect(screen.getByRole('grid')).toBeVisible();
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders).toHaveLength(2);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Size' })).toBeVisible();
  });

  it('should display image names and sizes', () => {
    const node = createMockNode([
      {
        names: ['nginx:latest', 'nginx@sha256:abc123'],
        sizeBytes: 141516288,
      },
    ]);

    render(<NodeDetailsImages node={node} />);

    expect(screen.getByText('nginx:latest')).toBeVisible();
    expect(screen.getByText('135 MiB')).toBeVisible();
  });

  it('should prefer image name without @ symbol', () => {
    const node = createMockNode([
      {
        names: ['nginx@sha256:abc123', 'nginx:1.21'],
        sizeBytes: 1024,
      },
    ]);

    render(<NodeDetailsImages node={node} />);

    expect(screen.getByText('nginx:1.21')).toBeVisible();
    expect(screen.queryByText('nginx@sha256:abc123')).not.toBeInTheDocument();
  });

  it('should fallback to first name if all contain @ or <none>', () => {
    const node = createMockNode([
      {
        names: ['<none>@<none>', 'image@sha256:def456'],
        sizeBytes: 2048,
      },
    ]);

    render(<NodeDetailsImages node={node} />);

    expect(screen.getByText('<none>@<none>')).toBeVisible();
  });

  it('should filter out images without names', () => {
    const node = createMockNode([
      {
        names: ['valid-image:latest'],
        sizeBytes: 1024,
      },
      {
        names: null,
        sizeBytes: 2048,
      },
    ]);

    render(<NodeDetailsImages node={node} />);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2);
  });

  it('should display zero bytes for zero size', () => {
    const node = createMockNode([
      {
        names: ['image:latest'],
        sizeBytes: 0,
      },
    ]);

    render(<NodeDetailsImages node={node} />);

    expect(screen.getByText('0 B')).toBeVisible();
  });
});
