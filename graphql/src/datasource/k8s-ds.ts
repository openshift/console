import { RESTDataSource } from 'apollo-datasource-rest';
import { Agent } from 'https';

const getK8sAPIPath = ({ apiGroup = 'core', apiVersion }) => {
  const isLegacy = apiGroup === 'core' && apiVersion === 'v1';
  let p = '';
  if (isLegacy) {
    p += '/api/';
  } else {
    p += '/apis/';
  }

  if (!isLegacy && apiGroup) {
    p += `${apiGroup}/`;
  }

  p += apiVersion;
  return p;
};

const resourceURL = ({ apiVersion, apiGroup, plural }) =>
  `${getK8sAPIPath({ apiVersion, apiGroup })}/${plural}`;

export default class K8sDS extends RESTDataSource {
  agent: Agent;

  constructor(offCluster) {
    super();
    this.baseURL =
      process.env.BRIDGE_K8S_MODE_OFF_CLUSTER_ENDPOINT || 'https://kubernetes.default.svc';
    this.agent = offCluster ? new Agent({ rejectUnauthorized: false }) : null;
  }

  createResource = (kind, opts) => {
    const url = resourceURL(kind);
    return this.postJSON(url, opts);
  };

  fetchJSON = (path) =>
    this.get(path, null, {
      agent: this.agent,
      headers: {
        Authorization: this.context.token,
      },
    });

  postJSON = (path, body) =>
    this.post(path, body, {
      agent: this.agent,
      headers: {
        Authorization: this.context.token,
      },
    });
}
