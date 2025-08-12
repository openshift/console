import * as React from 'react';
import { configure, render, screen } from '@testing-library/react';
import * as FileUploadContextModule from '@console/app/src/components/file-upload/file-upload-context';
import * as AddToProjectAccessModule from '@console/dev-console/src/utils/useAddToProjectAccess';
import * as rbacModule from '@console/internal/components/utils/rbac';
import * as SharedHooks from '@console/shared';
import TopologyPageToolbar from '../components/page/TopologyPageToolbar';
import { ModelContext } from '../data-transforms/ModelContext';
import { TopologyViewType } from '../topology-types';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test-id' });

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('react-redux', () => {
  const ActualReactRedux = jest.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});

jest.mock('@console/shared', () => {
  const ActualShared = jest.requireActual('@console/shared');
  return {
    ...ActualShared,
    useQueryParams: () => new Map(),
    useIsMobile: jest.fn(),
  };
});

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(),
}));

jest.mock('@console/dev-console/src/utils/useAddToProjectAccess', () => ({
  useAddToProjectAccess: jest.fn(),
}));

jest.mock('@console/app/src/components/file-upload/file-upload-context', () => ({
  FileUploadContext: { extensions: ['.yaml'] },
}));

describe('TopologyPageToolbar tests', () => {
  const mockContext = {
    isEmptyModel: false,
    namespace: 'test-namespace',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(rbacModule, 'useAccessReview').mockReturnValue(true);
    jest.spyOn(SharedHooks, 'useIsMobile').mockReturnValue(false);
    jest.spyOn(AddToProjectAccessModule, 'useAddToProjectAccess').mockReturnValue(['import']);
    jest.spyOn(React, 'useContext').mockImplementation((ctx) => {
      if (ctx === FileUploadContextModule.FileUploadContext) {
        return { extensions: ['.yaml'] };
      }
      if (ctx === ModelContext) {
        return mockContext;
      }
      return {};
    });
  });

  it('should render view shortcuts button on graph view', () => {
    render(<TopologyPageToolbar viewType={TopologyViewType.graph} onViewChange={jest.fn()} />);
    expect(screen.getByTestId('topology-view-shortcuts')).toBeInTheDocument();
  });

  it('should render view shortcuts button on list view', () => {
    render(<TopologyPageToolbar viewType={TopologyViewType.list} onViewChange={jest.fn()} />);
    expect(screen.getByTestId('topology-view-shortcuts')).toBeInTheDocument();
  });

  it('should show the topology icon when in list view (meaning switch to graph)', () => {
    render(<TopologyPageToolbar viewType={TopologyViewType.list} onViewChange={jest.fn()} />);
    expect(screen.getByLabelText('Graph view')).toBeInTheDocument();
  });

  it('should show the list icon when in graph view (meaning switch to list)', () => {
    render(<TopologyPageToolbar viewType={TopologyViewType.graph} onViewChange={jest.fn()} />);
    expect(screen.getByLabelText('List view')).toBeInTheDocument();
  });

  it('should not show toolbar when no namespace is set', () => {
    jest.spyOn(React, 'useContext').mockImplementation((ctx) => {
      if (ctx === FileUploadContextModule.FileUploadContext) {
        return { extensions: [] };
      }
      if (ctx === ModelContext) {
        return {
          isEmptyModel: false,
          namespace: undefined,
        };
      }
      return {};
    });

    const { container } = render(
      <TopologyPageToolbar viewType={TopologyViewType.graph} onViewChange={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should disable view switcher when model is empty', () => {
    jest.spyOn(React, 'useContext').mockImplementation((ctx) => {
      if (ctx === FileUploadContextModule.FileUploadContext) {
        return { extensions: [] };
      }
      if (ctx === ModelContext) {
        return {
          isEmptyModel: true,
          namespace: 'test-namespace',
        };
      }
      return {};
    });

    render(<TopologyPageToolbar viewType={TopologyViewType.graph} onViewChange={jest.fn()} />);
    const switcher = screen.getByTestId('topology-switcher-view');
    expect(switcher).toBeDisabled();
  });
});
