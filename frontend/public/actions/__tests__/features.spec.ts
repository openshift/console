import { FLAGS } from '@console/shared/src/constants/common';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import { detectFeatures } from '../features';
import { setFlag } from '../flags';

jest.mock('@console/shared/src/utils/console-fetch', () => {
  const fetchJSON = jest.fn();
  (fetchJSON as any).post = jest.fn();
  return { coFetchJSON: fetchJSON };
});

const httpError = (status: number) =>
  Object.assign(new Error(`${status}`), { response: { status } });

const runDetection = async (projectRequestsError: Error) => {
  (coFetchJSON as unknown as jest.Mock).mockImplementation((url: string) =>
    url.includes('/project.openshift.io/')
      ? Promise.reject(projectRequestsError)
      : Promise.reject(httpError(404)),
  );
  (coFetchJSON.post as jest.Mock).mockRejectedValue(httpError(404));
  const dispatch = jest.fn();
  await detectFeatures()(dispatch);
  return dispatch.mock.calls.map(([action]) => action);
};

describe('detectFeatures: CAN_CREATE_PROJECT', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // detectUser logs its (expected) 404.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('is false when the project API does not exist (plain Kubernetes)', async () => {
    const actions = await runDetection(httpError(404));
    expect(actions).toContainEqual(setFlag(FLAGS.CAN_CREATE_PROJECT, false));
  });

  it('is false when project creation is forbidden', async () => {
    const actions = await runDetection(httpError(403));
    expect(actions).toContainEqual(setFlag(FLAGS.CAN_CREATE_PROJECT, false));
  });

  it('stays unset on a server error', async () => {
    const actions = await runDetection(httpError(500));
    expect(actions).not.toContainEqual(setFlag(FLAGS.CAN_CREATE_PROJECT, false));
  });
});
