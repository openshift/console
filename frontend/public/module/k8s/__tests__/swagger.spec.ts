import type { SwaggerAPISpec, SwaggerDefinitions } from '../swagger';

const mockCoFetch = jest.fn();
jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetch: mockCoFetch,
}));

const mockDefinitions: SwaggerDefinitions = {
  'io.k8s.api.core.v1.Pod': {
    description: 'Pod is a collection of containers.',
    type: 'object',
    properties: {
      metadata: { $ref: '#/definitions/io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta' },
    },
  },
};

const createMockResponse = (definitions: SwaggerDefinitions, etag?: string): Response =>
  (({
    status: 200,
    ok: true,
    headers: new Headers(etag ? { ETag: etag } : {}),
    json: jest.fn().mockResolvedValue({
      swagger: '2.0',
      info: { title: 'Kubernetes', version: 'v1' },
      paths: {},
      definitions,
    } as SwaggerAPISpec),
  } as unknown) as Response);

const create304Response = (): Response =>
  (({
    status: 304,
    ok: true,
    headers: new Headers(),
    json: jest.fn(),
  } as unknown) as Response);

describe('fetchSwagger', () => {
  let fetchSwagger: () => Promise<SwaggerDefinitions>;
  let getSwaggerDefinitions: () => SwaggerDefinitions;

  beforeEach(() => {
    jest.isolateModules(() => {
      // Fresh module to reset cachedETag and swaggerDefinitions
      const swagger = require('../swagger');
      fetchSwagger = swagger.fetchSwagger;
      getSwaggerDefinitions = swagger.getSwaggerDefinitions;
    });
    mockCoFetch.mockReset();
    jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch and return swagger definitions on first call', async () => {
    mockCoFetch.mockResolvedValue(createMockResponse(mockDefinitions, '"abc123"'));

    const result = await fetchSwagger();

    expect(result).toEqual(mockDefinitions);
    expect(mockCoFetch).toHaveBeenCalledWith('api/kubernetes/openapi/v2', {
      headers: { Accept: 'application/json' },
      priority: 'low',
    });
  });

  it('should send If-None-Match header on subsequent requests', async () => {
    mockCoFetch.mockResolvedValue(createMockResponse(mockDefinitions, '"abc123"'));
    await fetchSwagger();

    mockCoFetch.mockResolvedValue(create304Response());
    await fetchSwagger();

    expect(mockCoFetch).toHaveBeenCalledTimes(2);
    expect(mockCoFetch.mock.calls[1]).toEqual([
      'api/kubernetes/openapi/v2',
      { headers: { Accept: 'application/json', 'If-None-Match': '"abc123"' }, priority: 'low' },
    ]);
  });

  it('should return cached definitions on 304', async () => {
    mockCoFetch.mockResolvedValue(createMockResponse(mockDefinitions, '"abc123"'));
    await fetchSwagger();

    const notModifiedResponse = create304Response();
    mockCoFetch.mockResolvedValue(notModifiedResponse);
    const result = await fetchSwagger();

    expect(result).toEqual(mockDefinitions);
    expect(notModifiedResponse.json).not.toHaveBeenCalled();
  });

  it('should update definitions when server returns new data', async () => {
    mockCoFetch.mockResolvedValue(createMockResponse(mockDefinitions, '"abc123"'));
    await fetchSwagger();

    const updatedDefinitions: SwaggerDefinitions = {
      ...mockDefinitions,
      'io.k8s.api.apps.v1.Deployment': { description: 'A Deployment.', type: 'object' },
    };
    mockCoFetch.mockResolvedValue(createMockResponse(updatedDefinitions, '"def456"'));
    const result = await fetchSwagger();

    expect(result).toEqual(updatedDefinitions);
    expect(getSwaggerDefinitions()).toEqual(updatedDefinitions);
  });

  it('should dispatch console_swagger_refresh on successful fetch', async () => {
    mockCoFetch.mockResolvedValue(createMockResponse(mockDefinitions, '"abc123"'));
    await fetchSwagger();

    expect(window.dispatchEvent).toHaveBeenCalledWith(new Event('console_swagger_refresh'));
  });

  it('should not dispatch console_swagger_refresh on 304', async () => {
    mockCoFetch.mockResolvedValue(createMockResponse(mockDefinitions, '"abc123"'));
    await fetchSwagger();
    (window.dispatchEvent as jest.Mock).mockClear();

    mockCoFetch.mockResolvedValue(create304Response());
    await fetchSwagger();

    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });

  it('should return null when definitions are missing from response', async () => {
    const response = ({
      status: 200,
      ok: true,
      headers: new Headers(),
      json: jest.fn().mockResolvedValue({ swagger: '2.0', paths: {} }),
    } as unknown) as Response;
    mockCoFetch.mockResolvedValue(response);

    const result = await fetchSwagger();

    expect(result).toBeNull();
  });

  it('should return null on fetch error', async () => {
    mockCoFetch.mockRejectedValue(new Error('Network error'));

    const result = await fetchSwagger();

    expect(result).toBeNull();
  });

  it('should work without ETag header from server', async () => {
    mockCoFetch.mockResolvedValue(createMockResponse(mockDefinitions));
    const result = await fetchSwagger();

    expect(result).toEqual(mockDefinitions);

    mockCoFetch.mockResolvedValue(createMockResponse(mockDefinitions));
    await fetchSwagger();

    expect(mockCoFetch.mock.calls[1]).toEqual([
      'api/kubernetes/openapi/v2',
      { headers: { Accept: 'application/json' }, priority: 'low' },
    ]);
  });
});
