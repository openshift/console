import * as fileSaver from 'file-saver';
import * as coFetchModule from '@console/shared/src/utils/console-fetch';
import { downloadKubeconfig } from '../download-kubeconfig';

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetch: jest.fn(),
}));

describe('downloadKubeconfig', () => {
  const mockConsoleFetch = coFetchModule.coFetch as jest.Mock;
  const mockSaveAs = fileSaver.saveAs as jest.Mock;
  const blob = new Blob(['kubeconfig content']);

  const mockResponseWithDisposition = (disposition: string | null): Partial<Response> => ({
    blob: jest.fn().mockResolvedValue(blob),
    headers: {
      get: (name: string) => (name === 'Content-Disposition' ? disposition : null),
    } as unknown as Headers,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleFetch.mockResolvedValue(
      mockResponseWithDisposition('attachment; filename="kubeconfig-my-ns-my-sa"') as Response,
    );
  });

  it('POSTs the ServiceAccount request body and saves the blob using the header filename', async () => {
    await downloadKubeconfig('ServiceAccount', 'my-sa', 'my-ns');

    expect(mockConsoleFetch).toHaveBeenCalledWith('/api/kubeconfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceType: 'ServiceAccount',
        name: 'my-sa',
        namespace: 'my-ns',
      }),
    });
    expect(mockSaveAs).toHaveBeenCalledWith(blob, 'kubeconfig-my-ns-my-sa');
  });

  it('POSTs a User request without name or namespace and keeps the plain filename', async () => {
    mockConsoleFetch.mockResolvedValue(
      mockResponseWithDisposition('attachment; filename="kubeconfig"') as Response,
    );
    await downloadKubeconfig('User');

    expect(mockConsoleFetch).toHaveBeenCalledWith('/api/kubeconfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceType: 'User' }),
    });
    expect(mockSaveAs).toHaveBeenCalledWith(blob, 'kubeconfig');
  });

  it('falls back to "kubeconfig" when no Content-Disposition header is present', async () => {
    mockConsoleFetch.mockResolvedValue(mockResponseWithDisposition(null) as Response);
    await downloadKubeconfig('User');

    expect(mockSaveAs).toHaveBeenCalledWith(blob, 'kubeconfig');
  });

  it('rejects and does not save when the fetch fails', async () => {
    mockConsoleFetch.mockRejectedValue(new Error('403 Forbidden'));

    await expect(downloadKubeconfig('ServiceAccount', 'my-sa', 'my-ns')).rejects.toThrow(
      '403 Forbidden',
    );
    expect(mockSaveAs).not.toHaveBeenCalled();
  });
});
