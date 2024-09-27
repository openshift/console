import {
  IncompleteDataError,
  TimeoutError,
} from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { configure, render } from '@testing-library/react';
import * as React from 'react';
import {
  AccessDenied,
  EmptyBox,
  LoadError,
  Loading,
  LoadingBox,
  LoadingInline,
  ConsoleEmptyState,
  StatusBox,
} from '../status-box';

configure({ testIdAttribute: 'data-test' });

describe('LoadError', () => {
  it('should render info with label and message', () => {
    const { getByText } = render(<LoadError label="test-label">test-message</LoadError>);
    getByText('Error Loading test-label: test-message');
  });

  it('should render info with label and without message', () => {
    const { getByText } = render(<LoadError label="test-label" />);
    getByText('Error Loading test-label');
  });

  it('should render with retry button', () => {
    const { getByText } = render(<LoadError label="test-label" />);
    getByText('Try again');
  });

  it('should render without retry button', () => {
    const { queryByText } = render(<LoadError label="test-label" canRetry={false} />);
    expect(queryByText('Try again')).toBeNull();
  });
});

describe('Loading', () => {
  it('should render skeleton', () => {
    const { getByTestId } = render(<Loading />);
    getByTestId('loading-indicator');
  });
});

describe('LoadingInline', () => {
  it('should render skeleton', () => {
    const { getByTestId } = render(<LoadingInline />);
    getByTestId('loading-indicator');
  });
});

describe('LoadingBox', () => {
  it('should render skeleton', () => {
    const { getByTestId } = render(<LoadingBox />);
    getByTestId('loading-indicator');
  });

  it('should render children', () => {
    const { getByText } = render(<LoadingBox>test-child</LoadingBox>);
    getByText('test-child');
  });
});

describe('EmptyBox', () => {
  it('should render without label', () => {
    const { getByText } = render(<EmptyBox />);
    getByText('Not found');
  });

  it('should render with label', () => {
    const { getByText } = render(<EmptyBox label="test-label" />);
    getByText('No test-label found');
  });
});

describe('MsgBox', () => {
  it('should render title', () => {
    const { getByText } = render(<ConsoleEmptyState title="test-title" />);
    getByText('test-title');
  });

  it('should render children', () => {
    const { getByText } = render(<ConsoleEmptyState>test-child</ConsoleEmptyState>);
    getByText('test-child');
  });
});

describe('AccessDenied', () => {
  it('should render message', () => {
    const { getByText } = render(<AccessDenied>test-message</AccessDenied>);
    getByText('test-message');
  });
});

describe('StatusBox', () => {
  it('should render 404: Not Found if the loadError status is 404', () => {
    const { getByText } = render(<StatusBox loadError={{ response: { status: 404 } }} />);
    getByText('404: Not Found');
  });

  it('should render access denied info together with the error message', () => {
    const { getByText } = render(
      <StatusBox loadError={{ message: 'test-message', response: { status: 403 } }} />,
    );

    getByText("You don't have access to this section due to cluster policy.");
    getByText('test-message');
  });

  it('should render a patternfly alert together with its children when an IncompleteDataError occured', () => {
    const { getByText } = render(
      <StatusBox
        loaded
        data={[{}]}
        loadError={new IncompleteDataError(['Test', 'RedHat', 'Hello World'])}
      >
        my-children
      </StatusBox>,
    );

    getByText(
      'Test, RedHat, and Hello World content is not available in the catalog at this time due to loading failures.',
    );
    getByText('my-children');
  });

  it('should render an info together with its children when loaded and a TimeOutError ocurred', () => {
    const { getByText } = render(
      <StatusBox loaded data={[{}]} loadError={new TimeoutError('url', 346)}>
        my-children
      </StatusBox>,
    );

    getByText('Timed out fetching new data. The data below is stale.');
    getByText('my-children');
  });

  it("should render skeleton when not loaded and there's no error", () => {
    const { getByTestId } = render(<StatusBox loaded={false} />);
    getByTestId('loading-indicator');
  });

  it("should render its children when loaded and there's no error", () => {
    const { getByText } = render(
      <StatusBox loaded data={[{}]}>
        my-children
      </StatusBox>,
    );

    getByText('my-children');
  });
});
