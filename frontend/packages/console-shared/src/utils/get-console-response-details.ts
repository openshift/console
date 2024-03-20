import { K8sResourceCommon } from '@console/internal/module/k8s';

const parseData = async (response) => {
  const text = await response.text();
  const isPlainText = response.headers.get('Content-Type') === 'text/plain';
  if (!text) {
    return isPlainText ? '' : {};
  }
  return isPlainText || !response.ok ? text : JSON.parse(text);
};

/**
 * This function takes a response object, converts the response to JSON or text, and then returns the data, headers, and status.
 * @param {Response} response - The response object to process.
 * @return {Promise<{ data: R, headers: Headers, status: number }>} - A promise that resolves to an object containing the data, headers, and status of the response.
 */
export const getConsoleResponseDetails = async <R extends K8sResourceCommon>(
  response: Response,
): Promise<{ data: R; headers: Headers; status: number }> => {
  const res = await response;
  const data = await parseData(res);
  const { headers, status } = res;

  return { data, headers, status };
};
