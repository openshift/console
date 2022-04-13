import { setUtilsConfig } from '@console/dynamic-plugin-sdk/src/app/configSetup';
import { appInternalFetch } from '@console/internal/co-fetch';
import { sampleTektonHubCatalogItem } from '../../../../test-data/catalog-item-data';
import {
  TektonHubTaskVersion,
  getApiResponse,
  getHubUIPath,
  TEKTON_HUB_ENDPOINT,
} from '../tektonHub';

const emptyHeaders = new Headers();
const apiResults = ({
  ok,
  status,
  versions,
}: {
  ok: boolean;
  status?: number;
  versions?: TektonHubTaskVersion[];
}) =>
  Promise.resolve({
    headers: emptyHeaders,
    ok,
    ...(status && { status }),
    json: () => ({
      data: {
        versions,
      },
    }),
  });

setUtilsConfig({ appFetch: appInternalFetch });

describe('getApiResponse', () => {
  beforeEach(() => {
    window.fetch = jest.fn(() =>
      apiResults({
        ok: true,
        status: 200,
        versions: sampleTektonHubCatalogItem.attributes.versions,
      }),
    );
    window.console.warn = jest.fn(() => '');
  });

  afterEach(() => {
    (window.fetch as jest.Mock).mockClear();
    (window.console.warn as jest.Mock).mockClear();
  });

  it('should throw error if the response status is not 200', async () => {
    window.fetch = jest.fn(() => Promise.resolve({ status: 404, headers: emptyHeaders }));
    try {
      await getApiResponse('testurl');
      fail('Expect an error if the response status is not 200');
    } catch (e) {
      expect(e?.code).toBe(404);
    }
  });

  it('should throw error if the response ok is false', async () => {
    window.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 500, headers: emptyHeaders }),
    );

    try {
      await getApiResponse('testurl');
      fail('Expect an error if the response ok is false');
    } catch (e) {
      expect(e?.response?.ok).toBe(false);
    }
  });

  it('should return a valid response', async () => {
    const response = await getApiResponse('testurl');
    expect(response.data).toBeDefined();
    expect(response.data.versions).toBeDefined();
  });
});

describe('getHubUIPath', () => {
  it('should return null if the path is not set', () => {
    expect(getHubUIPath('')).toBeNull();
    expect(getHubUIPath(null)).toBeNull();
    expect(getHubUIPath(undefined)).toBeNull();
  });

  it('should return a value if the path is set', () => {
    expect(getHubUIPath('test')).not.toBeNull();
    expect(getHubUIPath('test-path')).toBe(`${TEKTON_HUB_ENDPOINT}/test-path`);
  });

  it('should return custom path url if the baseurl param is passed as a second argument', () => {
    expect(getHubUIPath('test-path', 'https://hub-ui.com')).toBe(`https://hub-ui.com/test-path`);
  });
});
