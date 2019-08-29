import * as process from 'process';

export const TEMP_DIR = 'tmp';
export const SRC_DIR = 'src';

export const buildTempPath = (...segments) => [TEMP_DIR, ...segments].join('/');
export const buildSrcPath = (...segments) => [SRC_DIR, ...segments].join('/');

const OPENSHIFT_PREFIX = 'OS';

export type Config = {
  name: string;
  url: string;
  replaceMapping?: { [key: string]: string };
  dateAsString?: boolean;
};

export const getOpenshiftConfig = (): Config => ({
  name: 'openshift',
  url:
    process.env.OPENSHIFT_API_SPEC_URL ||
    'https://raw.githubusercontent.com/openshift/origin/master/api/swagger-spec/openshift-openapi-spec.json',
  dateAsString: true,
  replaceMapping: {
    ComGithubOpenshiftApiApps: OPENSHIFT_PREFIX,
    ComGithubOpenshiftApiAuthorization: OPENSHIFT_PREFIX,
    ComGithubOpenshiftApiBuild: OPENSHIFT_PREFIX,
    ComGithubOpenshiftApiImage: OPENSHIFT_PREFIX,
    ComGithubOpenshiftApiNetwork: OPENSHIFT_PREFIX,
    ComGithubOpenshiftApiOauth: OPENSHIFT_PREFIX,
    ComGithubOpenshiftApiProject: '',
    ComGithubOpenshiftApiQuota: OPENSHIFT_PREFIX,
    ComGithubOpenshiftApiRoute: '',
    ComGithubOpenshiftApiSecurity: OPENSHIFT_PREFIX,
    ComGithubOpenshiftApiTemplate: '',
    ComGithubOpenshiftApiUser: OPENSHIFT_PREFIX,
    IoK8sApiAdmissionregistration: '',
    IoK8sApiApps: '',
    IoK8sApiAuthentication: '',
    IoK8sApiAuthorization: '',
    IoK8sApiAutoscaling: '',
    IoK8sApiBatch: '',
    IoK8sApiCertificates: '',
    IoK8sApiCore: '',
    IoK8sApiEvents: '',
    IoK8sApiExtensions: 'Extensions',
    IoK8sApimachineryPkgApisMeta: '',
    IoK8sApiNetworking: '',
    IoK8sApiPolicy: '',
    IoK8sApiRbac: '',
    IoK8sApiScheduling: '',
    IoK8sApiStorage: '',
    IoK8sKubeAggregatorPkgApisApiregistration: 'APIRegistration',
  },
});

export const getKubevirtConfig = (): Config => ({
  name: 'kubevirt',
  url:
    process.env.KUBEVIRT_API_SPEC_URL ||
    'https://raw.githubusercontent.com/kubevirt/kubevirt/master/api/openapi-spec/swagger.json',
  dateAsString: true,
});
