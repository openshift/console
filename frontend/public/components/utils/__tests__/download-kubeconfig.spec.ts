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

  beforeEach(() => {
    jest.clearAllMocks();
    const mockResponse: Partial<Response> = {
      blob: jest.fn().mockResolvedValue(blob),
    };
    mockConsoleFetch.mockResolvedValue(mockResponse as Response);
  });

  it('POSTs the ServiceAccount request body and saves the returned blob', async () => {
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
    expect(mockSaveAs).toHaveBeenCalledWith(blob, 'kubeconfig');
  });

  it('POSTs a User request without name or namespace', async () => {
    await downloadKubeconfig('User');

    expect(mockConsoleFetch).toHaveBeenCalledWith('/api/kubeconfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceType: 'User' }),
    });
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
