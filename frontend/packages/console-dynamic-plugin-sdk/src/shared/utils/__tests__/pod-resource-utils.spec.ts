import * as _ from 'lodash';
import {
  sampleCronJobs,
  sampleDaemonSets,
  sampleDeploymentConfigs,
  sampleDeployments,
  sampleStatefulSets,
  MockResources,
} from '@console/dynamic-plugin-sdk/src/shared/utils/__tests__/test-resource-data';
import {
  getPodsForDeploymentConfig,
  getPodsForDeployment,
  getPodsForStatefulSet,
  getPodsForDaemonSet,
  getPodsForCronJob,
  getPodsForDeploymentConfigs,
  getPodsForDeployments,
  getPodsForStatefulSets,
  getPodsForDaemonSets,
  getPodsForCronJobs,
} from '../pod-resource-utils';

let mockResources;

describe('getPodsFor...', () => {
  beforeEach(() => {
    mockResources = _.cloneDeep(MockResources);
  });

  it('should return pods and replication controllers for a given DeploymentConfig', () => {
    let podRCData = getPodsForDeploymentConfig(sampleDeploymentConfigs.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(1);
    expect(podRCData.current).not.toBeNull();
    expect(podRCData.previous).toBeFalsy();
    expect(podRCData.isRollingOut).toBeFalsy();

    podRCData = getPodsForDeploymentConfig(null, mockResources);
    expect(podRCData.pods).toHaveLength(0);

    mockResources.replicationControllers = { loaded: false, loadError: 'error', data: [] };
    podRCData = getPodsForDeploymentConfig(sampleDeploymentConfigs.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(0);

    delete mockResources.replicationControllers;
    podRCData = getPodsForDeploymentConfig(sampleDeploymentConfigs.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(0);
  });

  it('should return pods for a given Deployment', () => {
    let podRCData = getPodsForDeployment(sampleDeployments.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(3);
    expect(podRCData.current).not.toBeNull();
    expect(podRCData.previous).toBeFalsy();
    expect(podRCData.isRollingOut).toBeFalsy();

    podRCData = getPodsForDeployment(null, mockResources);
    expect(podRCData.pods).toHaveLength(0);

    podRCData = getPodsForDeployment(null, mockResources);
    expect(podRCData.pods).toHaveLength(0);

    mockResources.replicaSets = { loaded: false, loadError: 'error', data: [] };
    podRCData = getPodsForDeployment(sampleDeployments.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(0);

    delete mockResources.replicaSets;
    podRCData = getPodsForDeployment(sampleDeployments.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(0);
  });

  it('should return pods for a given StatefulSet', () => {
    let podRCData = getPodsForStatefulSet(sampleStatefulSets.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(1);
    expect(podRCData.current).not.toBeNull();
    expect(podRCData.previous).toBeFalsy();
    expect(podRCData.isRollingOut).toBeFalsy();

    podRCData = getPodsForStatefulSet(null, mockResources);
    expect(podRCData.pods).toHaveLength(0);

    podRCData = getPodsForStatefulSet(null, mockResources);
    expect(podRCData.pods).toHaveLength(0);

    mockResources.statefulSets = { loaded: false, loadError: 'error', data: [] };
    podRCData = getPodsForStatefulSet(sampleStatefulSets.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(0);

    delete mockResources.statefulSets;
    podRCData = getPodsForStatefulSet(sampleStatefulSets.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(0);
  });

  it('should return pods for a given DaemonSet', () => {
    let podRCData = getPodsForDaemonSet(sampleDaemonSets.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(1);
    expect(podRCData.current).not.toBeNull();
    expect(podRCData.previous).toBeFalsy();
    expect(podRCData.isRollingOut).toBeFalsy();

    podRCData = getPodsForDaemonSet(null, mockResources);
    expect(podRCData.pods).toHaveLength(0);

    podRCData = getPodsForDaemonSet(null, mockResources);
    expect(podRCData.pods).toHaveLength(0);

    mockResources.pods = { loaded: false, loadError: 'error', data: [] };
    podRCData = getPodsForDaemonSet(sampleDaemonSets.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(0);

    delete mockResources.pods;
    podRCData = getPodsForDaemonSet(sampleDaemonSets.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(0);
  });

  it('should return pods for a given CronJob', () => {
    let podRCData = getPodsForCronJob(sampleCronJobs.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(2);
    expect(podRCData.current).not.toBeNull();
    expect(podRCData.previous).toBeFalsy();
    expect(podRCData.isRollingOut).toBeFalsy();

    podRCData = getPodsForCronJob(null, mockResources);
    expect(podRCData.pods).toHaveLength(0);

    podRCData = getPodsForCronJob(null, mockResources);
    expect(podRCData.pods).toHaveLength(0);

    mockResources.jobs = { loaded: false, loadError: 'error', data: [] };
    podRCData = getPodsForCronJob(sampleCronJobs.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(0);

    delete mockResources.jobs;
    podRCData = getPodsForCronJob(sampleCronJobs.data[0], mockResources);
    expect(podRCData.pods).toHaveLength(0);
  });

  it('should return pods and replication controllers for a set of DeploymentConfigs', () => {
    let podRCDataArray = getPodsForDeploymentConfigs(sampleDeploymentConfigs.data, mockResources);
    expect(podRCDataArray).toHaveLength(2);
    expect(podRCDataArray[0].pods).toHaveLength(1);
    expect(podRCDataArray[0].current).not.toBeNull();
    expect(podRCDataArray[0].previous).toBeFalsy();
    expect(podRCDataArray[0].isRollingOut).toBeFalsy();
    expect(podRCDataArray[1].pods).toHaveLength(0);

    podRCDataArray = getPodsForDeploymentConfigs([], mockResources);
    expect(podRCDataArray).toHaveLength(0);

    podRCDataArray = getPodsForDeploymentConfigs(null, mockResources);
    expect(podRCDataArray).toHaveLength(0);

    mockResources.replicationControllers = { loaded: false, loadError: 'error', data: [] };
    podRCDataArray = getPodsForDeploymentConfigs(sampleDeploymentConfigs.data, mockResources);
    expect(podRCDataArray).toHaveLength(2);
    expect(podRCDataArray[0].pods).toHaveLength(0);
    expect(podRCDataArray[1].pods).toHaveLength(0);

    delete mockResources.replicationControllers;
    podRCDataArray = getPodsForDeploymentConfigs(sampleDeploymentConfigs.data, mockResources);
    expect(podRCDataArray).toHaveLength(2);
    expect(podRCDataArray[0].pods).toHaveLength(0);
    expect(podRCDataArray[1].pods).toHaveLength(0);
  });

  it('should return pods for a given Deployment', () => {
    let podRCDataArray = getPodsForDeployments(sampleDeployments.data, mockResources);
    expect(podRCDataArray).toHaveLength(3);
    expect(podRCDataArray[0].pods).toHaveLength(3);
    expect(podRCDataArray[0].current).not.toBeNull();
    expect(podRCDataArray[0].previous).toBeFalsy();
    expect(podRCDataArray[0].isRollingOut).toBeFalsy();
    expect(podRCDataArray[1].pods).toHaveLength(3);
    expect(podRCDataArray[1].current).not.toBeNull();
    expect(podRCDataArray[1].previous).toBeFalsy();
    expect(podRCDataArray[1].isRollingOut).toBeFalsy();
    expect(podRCDataArray[2].pods).toHaveLength(0);

    podRCDataArray = getPodsForDeployments([], mockResources);
    expect(podRCDataArray).toHaveLength(0);

    podRCDataArray = getPodsForDeployments(null, mockResources);
    expect(podRCDataArray).toHaveLength(0);

    mockResources.replicaSets = { loaded: false, loadError: 'error', data: [] };
    podRCDataArray = getPodsForDeployments(sampleDeployments.data, mockResources);
    expect(podRCDataArray).toHaveLength(3);
    expect(podRCDataArray[0].pods).toHaveLength(0);
    expect(podRCDataArray[1].pods).toHaveLength(0);
    expect(podRCDataArray[2].pods).toHaveLength(0);

    delete mockResources.replicaSets;
    podRCDataArray = getPodsForDeployments(sampleDeployments.data, mockResources);
    expect(podRCDataArray).toHaveLength(3);
    expect(podRCDataArray[0].pods).toHaveLength(0);
    expect(podRCDataArray[1].pods).toHaveLength(0);
    expect(podRCDataArray[2].pods).toHaveLength(0);
  });

  it('should return pods for a set of StatefulSets', () => {
    let podRCDataArray = getPodsForStatefulSets(sampleStatefulSets.data, mockResources);
    expect(podRCDataArray).toHaveLength(1);
    expect(podRCDataArray[0].pods).toHaveLength(1);
    expect(podRCDataArray[0].current).not.toBeNull();
    expect(podRCDataArray[0].previous).toBeFalsy();
    expect(podRCDataArray[0].isRollingOut).toBeFalsy();

    podRCDataArray = getPodsForStatefulSets([], mockResources);
    expect(podRCDataArray).toHaveLength(0);

    podRCDataArray = getPodsForStatefulSets(null, mockResources);
    expect(podRCDataArray).toHaveLength(0);

    mockResources.statefulSets = { loaded: false, loadError: 'error', data: [] };
    podRCDataArray = getPodsForStatefulSets(sampleStatefulSets.data, mockResources);
    expect(podRCDataArray).toHaveLength(1);
    expect(podRCDataArray[0].pods).toHaveLength(0);

    delete mockResources.statefulSets;
    podRCDataArray = getPodsForStatefulSets(sampleStatefulSets.data, mockResources);
    expect(podRCDataArray).toHaveLength(1);
    expect(podRCDataArray[0].pods).toHaveLength(0);
  });

  it('should return pods for a set of DaemonSets', () => {
    let podRCDataArray = getPodsForDaemonSets(sampleDaemonSets.data, mockResources);
    expect(podRCDataArray).toHaveLength(1);
    expect(podRCDataArray[0].pods).toHaveLength(1);
    expect(podRCDataArray[0].current).not.toBeNull();
    expect(podRCDataArray[0].previous).toBeFalsy();
    expect(podRCDataArray[0].isRollingOut).toBeFalsy();

    podRCDataArray = getPodsForDaemonSets([], mockResources);
    expect(podRCDataArray).toHaveLength(0);

    podRCDataArray = getPodsForDaemonSets(null, mockResources);
    expect(podRCDataArray).toHaveLength(0);

    mockResources.pods = { loaded: false, loadError: 'error', data: [] };
    podRCDataArray = getPodsForDaemonSets(sampleDaemonSets.data, mockResources);
    expect(podRCDataArray).toHaveLength(1);
    expect(podRCDataArray[0].pods).toHaveLength(0);

    delete mockResources.pods;
    podRCDataArray = getPodsForDaemonSets(sampleDaemonSets.data, mockResources);
    expect(podRCDataArray).toHaveLength(1);
    expect(podRCDataArray[0].pods).toHaveLength(0);
  });

  it('should return pods for a set of CronJobs', () => {
    let podRCDataArray = getPodsForCronJobs(sampleCronJobs.data, mockResources);
    expect(podRCDataArray).toHaveLength(1);
    expect(podRCDataArray[0].pods).toHaveLength(2);
    expect(podRCDataArray[0].current).not.toBeNull();
    expect(podRCDataArray[0].previous).toBeFalsy();
    expect(podRCDataArray[0].isRollingOut).toBeFalsy();

    podRCDataArray = getPodsForCronJobs([], mockResources);
    expect(podRCDataArray).toHaveLength(0);

    podRCDataArray = getPodsForCronJobs(null, mockResources);
    expect(podRCDataArray).toHaveLength(0);

    mockResources.jobs = { loaded: false, loadError: 'error', data: [] };
    podRCDataArray = getPodsForCronJobs(sampleCronJobs.data, mockResources);
    expect(podRCDataArray).toHaveLength(1);
    expect(podRCDataArray[0].pods).toHaveLength(0);

    delete mockResources.jobs;
    podRCDataArray = getPodsForCronJobs(sampleCronJobs.data, mockResources);
    expect(podRCDataArray).toHaveLength(1);
    expect(podRCDataArray[0].pods).toHaveLength(0);
  });
});
