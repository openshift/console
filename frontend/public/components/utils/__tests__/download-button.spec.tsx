import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fileSaver from 'file-saver';

import { DownloadButton } from '../../../components/utils/download-button';
import * as coFetchModule from '@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch';

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

// Mock console-fetch
jest.mock('@console/dynamic-plugin-sdk/src/utils/fetch/console-fetch', () => ({
  consoleFetch: jest.fn(),
}));

describe('DownloadButton', () => {
  const url = 'http://google.com';
  const mockConsoleFetch = coFetchModule.consoleFetch as jest.Mock;
  const mockSaveAs = fileSaver.saveAs as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful blob response
    const mockResponse: Partial<Response> = {
      blob: jest.fn().mockResolvedValue(new Blob(['test content'])),
    };
    mockConsoleFetch.mockResolvedValue(mockResponse as Response);
    mockSaveAs.mockReturnValue(undefined);
  });

  it('renders button which calls `consoleFetch` to download URL when clicked', async () => {
    await act(async () => {
      render(<DownloadButton url={url} />);
    });

    const downloadButton = screen.getByRole('button');
    expect(downloadButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(downloadButton);
    });

    // Verify consoleFetch was called with the correct URL
    expect(mockConsoleFetch).toHaveBeenCalledWith(url, {}, 30000);
  });

  it('renders "Downloading..." if download is in flight', async () => {
    let resolvePromise: (value: Blob) => void;
    const controlledPromise = new Promise<Blob>((resolve) => {
      resolvePromise = resolve;
    });

    const mockResponse: Partial<Response> = {
      blob: jest.fn().mockReturnValue(controlledPromise),
    };
    mockConsoleFetch.mockResolvedValue(mockResponse as Response);

    await act(async () => {
      render(<DownloadButton url={url} />);
    });

    const downloadButton = screen.getByRole('button');

    // Click to start download
    await act(async () => {
      fireEvent.click(downloadButton);
    });

    // Check that button shows "Downloading..." while in flight
    await waitFor(() => {
      expect(screen.getByText('Downloading...')).toBeInTheDocument();
    });

    // Resolve the promise to complete the download
    await act(async () => {
      resolvePromise!(new Blob(['test content']));
    });
  });
});
