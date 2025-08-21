import { screen } from '@testing-library/react';
import * as utils from '@console/internal/components/utils/url-poll-hook';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import TopologyDataRenderer from '../components/page/TopologyDataRenderer';
import { ModelContext } from '../data-transforms/ModelContext';
import { TopologyViewType } from '../topology-types';
import '@testing-library/jest-dom';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: () => [],
}));
jest.mock('@console/shared', () => {
  const ActualShared = jest.requireActual('@console/shared');
  return {
    ...ActualShared,
    useQueryParams: () => new Map(),
  };
});

jest.mock('react-dnd', () => {
  const OriginalReactDnd = jest.requireActual('react-dnd');
  return {
    ...OriginalReactDnd,
    useDrag: () => [{ isDragging: false }, jest.fn(), null],
    useDrop: () => [{ isOver: false, canDrop: false }, jest.fn()],
    DragDropContext: ({ children }: { children: React.ReactNode }) => children,
    DragSource: () => (component: React.FC) => component,
    DropTarget: () => (component: React.FC) => component,
  };
});

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: jest.fn(),
}));

jest.mock('../components/page/TopologyView', () => () => 'Mocked Topology View');

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: () => true,
}));

jest.mock('@console/internal/components/utils/file-input', () => ({
  DroppableFileInput: () => 'Mock Droppable File Input',
}));

jest.mock('../components/page/DroppableTopologyComponent', () => ({
  DroppableTopologyComponent: () => 'Mock Droppable Topology Component',
}));

jest.mock('@console/dynamic-plugin-sdk', () => {
  const actual = jest.requireActual('@console/dynamic-plugin-sdk');
  return {
    ...actual,
    useAccessReview: () => true,
    useAccessReviewAllowed: () => true,
  };
});

jest.mock('@console/internal/components/utils/url-poll-hook', () => ({
  useURLPoll: jest.fn(),
}));

describe('DataModelProvider', () => {
  const mockContext = {
    namespace: 'test-namespace',
    model: { nodes: [], edges: [] },
    loaded: true,
    loadError: null,
  };
  beforeEach(() => {
    (utils.useURLPoll as jest.Mock).mockReturnValue([{}, null, false]);
  });

  it('should render inner components', async () => {
    renderWithProviders(
      <ModelContext.Provider value={mockContext as any}>
        <TopologyDataRenderer viewType={TopologyViewType.graph} />
      </ModelContext.Provider>,
    );
    expect(await screen.findByText('Mock Droppable Topology Component')).toBeInTheDocument();
  });
});
