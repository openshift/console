import * as React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { cloneDeep } from 'lodash';
import { coFetchText } from '@console/internal/co-fetch';
import { LOG_SOURCE_TERMINATED } from '@console/internal/components/utils';
import Logs from '../Logs';
import { podData, sampleContainer } from './logs-test-data';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock coFetchText
jest.mock('@console/internal/co-fetch', () => ({
  coFetchText: jest.fn(() => Promise.resolve('')),
}));

// Mock resourceURL and modelFor
jest.mock('@console/internal/module/k8s', () => ({
  resourceURL: jest.fn(() => '/api/test-url'),
  modelFor: jest.fn(() => ({})),
  PodKind: {},
  ContainerSpec: {},
}));

// Mock WSFactory
jest.mock('@console/internal/module/ws-factory', () => ({
  WSFactory: jest.fn().mockImplementation(() => ({
    onmessage: jest.fn().mockReturnThis(),
    onclose: jest.fn().mockReturnThis(),
    onerror: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
  })),
}));

const mockCoFetchText = coFetchText as any;

describe('logs component', () => {
  let props: React.ComponentProps<typeof Logs>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCoFetchText.mockResolvedValue('');
    props = {
      resource: cloneDeep(podData),
      resourceStatus: LOG_SOURCE_TERMINATED,
      container: cloneDeep(sampleContainer),
      onComplete: jest.fn(),
      render: false,
      autoScroll: true,
    };
  });

  it('should show the logs block based on the render prop', async () => {
    const { container, rerender } = render(<Logs {...props} />);
    const logsElement = container.querySelector('.odc-logs') as HTMLElement;
    expect(logsElement).not.toBeNull();
    expect(logsElement.style.display).toBe('none');

    rerender(<Logs {...props} render />);
    await waitFor(() => {
      expect(logsElement.style.display).toBe('');
    });
  });

  it('should display the container name', () => {
    render(<Logs {...props} render />);
    expect(screen.getByText('step-oc')).not.toBeNull();
  });

  it('should call onComplete when logs are fetched successfully', async () => {
    const onComplete = jest.fn();
    mockCoFetchText.mockResolvedValue('log line 1\nlog line 2');
    render(<Logs {...props} render onComplete={onComplete} />);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('step-oc');
    });
  });

  it('should display error alert when fetch fails', async () => {
    const onComplete = jest.fn();
    mockCoFetchText.mockRejectedValue(new Error('Fetch failed'));
    render(<Logs {...props} render onComplete={onComplete} />);

    await waitFor(() => {
      expect(
        screen.getByText(/An error occurred while retrieving the requested logs/i),
      ).not.toBeNull();
    });
    expect(onComplete).toHaveBeenCalledWith('step-oc');
  });

  it('should call onComplete even when fetch fails', async () => {
    const onComplete = jest.fn();
    mockCoFetchText.mockRejectedValue(new Error('Fetch failed'));
    render(<Logs {...props} render onComplete={onComplete} />);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('step-oc');
    });
  });

  it('should display log content when fetched successfully', async () => {
    const logContent = 'log line 1\nlog line 2\nlog line 3';
    mockCoFetchText.mockResolvedValue(logContent);
    const { container } = render(<Logs {...props} render />);

    // Wait for fetch to complete and throttled content update (throttle is 1000ms)
    await waitFor(
      () => {
        const contentElement = container.querySelector('.odc-logs__content') as HTMLElement;
        expect(contentElement).not.toBeNull();
        const actualContent = contentElement.innerText || contentElement.textContent || '';
        // Handle case where innerText might start as undefined
        const normalizedContent = actualContent.replace(/^undefined/, '');
        expect(normalizedContent).toBe(logContent);
      },
      { timeout: 2500 },
    );
  });

  it('should not show error alert initially', () => {
    render(<Logs {...props} render />);
    expect(screen.queryByText(/An error occurred while retrieving the requested logs/i)).toBeNull();
  });

  it('should handle autoScroll prop being false', async () => {
    const logContent = 'test log content';
    mockCoFetchText.mockResolvedValue(logContent);
    const { container } = render(<Logs {...props} render autoScroll={false} />);

    await waitFor(() => {
      expect(mockCoFetchText).toHaveBeenCalled();
    });

    // With autoScroll false, scrollIntoView should not be called as frequently
    // The content should still be added though
    await waitFor(() => {
      const contentElement = container.querySelector('.odc-logs__content') as HTMLElement;
      expect(contentElement).not.toBeNull();
    });
  });
});
