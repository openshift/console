import { render, screen } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { getTopologyShortcuts } from '../components/graph-view/TopologyShortcuts';
import { TopologyViewType } from '../topology-types';

const t = ((key: string) => key) as TFunction;

describe('TopologyShortcuts tests', () => {
  it('should show reduced list in view shortcuts popover when there are no workloads', () => {
    render(
      getTopologyShortcuts(t, {
        supportedFileTypes: undefined,
        isEmptyModel: true,
        viewType: TopologyViewType.graph,
        allImportAccess: true,
      }),
    );

    expect(screen.getByText(/open quick search modal/i)).toBeInTheDocument();
    expect(screen.getByText(/ctrl/i)).toBeInTheDocument();
    expect(screen.getByText(/spacebar/i)).toBeInTheDocument();

    expect(screen.queryByText(/create connector/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hover/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/context menu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/right click/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/view details/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/click/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/edit application grouping/i)).not.toBeInTheDocument();
  });

  it('should show drag and drop when supportedFileTypes is not empty', () => {
    render(
      getTopologyShortcuts(t, {
        supportedFileTypes: ['jar'],
        isEmptyModel: true,
        viewType: TopologyViewType.graph,
        allImportAccess: true,
      }),
    );

    expect(screen.getByText(/drag \+ drop/i)).toBeInTheDocument();
    expect(screen.getByText(/upload file.*to project/i)).toBeInTheDocument();
  });

  it('should show reduced list in list view', () => {
    render(
      getTopologyShortcuts(t, {
        supportedFileTypes: ['jar'],
        isEmptyModel: false,
        viewType: TopologyViewType.list,
        allImportAccess: true,
      }),
    );

    expect(screen.getByText(/upload file.*to project/i)).toBeInTheDocument();
    expect(screen.getByText(/view details/i)).toBeInTheDocument();
    expect(screen.getByText(/open quick search modal/i)).toBeInTheDocument();

    expect(screen.queryByText(/create connector/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/context menu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/edit application grouping/i)).not.toBeInTheDocument();
  });

  it('should show full list in graph view with all access', () => {
    render(
      getTopologyShortcuts(t, {
        supportedFileTypes: ['jar'],
        isEmptyModel: false,
        viewType: TopologyViewType.graph,
        allImportAccess: true,
      }),
    );

    expect(screen.getByText(/move/i)).toBeInTheDocument();
    expect(screen.getByText(/upload file.*to project/i)).toBeInTheDocument();
    expect(screen.getByText(/context menu/i)).toBeInTheDocument();
    expect(screen.getByText(/create connector/i)).toBeInTheDocument();
    expect(screen.getByText(/view details/i)).toBeInTheDocument();
    expect(screen.getByText(/open quick search modal/i)).toBeInTheDocument();
    expect(screen.getByText(/edit application grouping/i)).toBeInTheDocument();
  });

  it('should show minimal actions in list view without access', () => {
    render(
      getTopologyShortcuts(t, {
        supportedFileTypes: ['jar'],
        isEmptyModel: false,
        viewType: TopologyViewType.list,
        allImportAccess: false,
      }),
    );

    expect(screen.getByText(/view details/i)).toBeInTheDocument();
    expect(screen.getByText(/open quick search modal/i)).toBeInTheDocument();

    expect(screen.queryByText(/move/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create connector/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/context menu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/edit application grouping/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/upload file/i)).not.toBeInTheDocument();
  });

  it('should show minimal actions in graph view without access', () => {
    render(
      getTopologyShortcuts(t, {
        supportedFileTypes: ['jar'],
        isEmptyModel: false,
        viewType: TopologyViewType.graph,
        allImportAccess: false,
      }),
    );

    expect(screen.getByText(/move/i)).toBeInTheDocument();
    expect(screen.getByText(/view details/i)).toBeInTheDocument();
    expect(screen.getByText(/open quick search modal/i)).toBeInTheDocument();

    expect(screen.queryByText(/create connector/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/context menu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/edit application grouping/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/upload file/i)).not.toBeInTheDocument();
  });
});
