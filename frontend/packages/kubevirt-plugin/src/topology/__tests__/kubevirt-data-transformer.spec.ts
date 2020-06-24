import { ALL_APPLICATIONS_KEY } from '@console/shared';
import {
  baseDataModelGetter,
  getFilterById,
  getWorkloadResources,
  TopologyDataResources,
  updateModelFromFilters,
  WORKLOAD_TYPES,
  DEFAULT_TOPOLOGY_FILTERS,
} from '@console/dev-console/src/components/topology';
import { TEST_KINDS_MAP } from '@console/dev-console/src/components/topology/__tests__/topology-test-data';
import { kubevirtResources } from './topology-kubevirt-test-data';
import { VirtualMachineModel } from '../../models';
import { VMStatus } from '../../constants/vm/vm-status';
import { VMNodeData } from '../types';
import { getKubevirtTopologyDataModel } from '../kubevirt-data-transformer';
import {
  applyKubevirtDisplayOptions,
  getTopologyFilters,
  SHOW_VMS_FILTER_ID,
} from '../kubevirtFilters';
import { TYPE_VIRTUAL_MACHINE } from '../components/const';

const kindsMap = { ...TEST_KINDS_MAP, virtualmachines: VirtualMachineModel.kind };
const workloadTypes = [...WORKLOAD_TYPES, 'virtualmachines'];
const filterers = [applyKubevirtDisplayOptions];

const getTransformedTopologyData = (mockData: TopologyDataResources) => {
  const workloadResources = getWorkloadResources(mockData, kindsMap, workloadTypes);
  return getKubevirtTopologyDataModel('test-project', mockData).then((model) => {
    return baseDataModelGetter(model, 'test-project', mockData, workloadResources, []);
  });
};

describe('knative data transformer ', () => {
  it('should return transformed VMs', async () => {
    const result = await getTransformedTopologyData(kubevirtResources as any);
    const vmNodes = result.nodes.filter((node) => {
      return node.data.resources?.obj?.kind === VirtualMachineModel.kind;
    });
    expect(vmNodes).toHaveLength(2);

    const vmData = vmNodes[0].data.data as VMNodeData;
    expect(vmData.vmStatusBundle.status.getValue()).toEqual(VMStatus.RUNNING.getValue());
    expect(vmData.vmStatusBundle.pod).not.toBeNull();
    expect(vmData.vmi).not.toBeNull();
  });
  it('should hide VMs when filtered', async () => {
    const result = await getTransformedTopologyData(kubevirtResources as any);
    const vmNodes = result.nodes.filter((node) => {
      return node.data.resources?.obj?.kind === VirtualMachineModel.kind;
    });
    expect(vmNodes).toHaveLength(2);

    const vmData = vmNodes[0].data.data as VMNodeData;
    expect(vmData.vmStatusBundle.status.getValue()).toEqual(VMStatus.RUNNING.getValue());
    expect(vmData.vmStatusBundle.pod).not.toBeNull();
    expect(vmData.vmi).not.toBeNull();
  });

  it('should hide event sources when display filter is set', async () => {
    const result = await getTransformedTopologyData(kubevirtResources as any);
    expect(result.nodes.filter((n) => n.type === TYPE_VIRTUAL_MACHINE && !n.visible).length).toBe(
      0,
    );

    const filters = [...DEFAULT_TOPOLOGY_FILTERS];
    filters.push(...getTopologyFilters());
    getFilterById(SHOW_VMS_FILTER_ID, filters).value = false;
    const newModel = updateModelFromFilters(result, filters, ALL_APPLICATIONS_KEY, filterers);
    expect(newModel.nodes.filter((n) => n.type === TYPE_VIRTUAL_MACHINE && !n.visible).length).toBe(
      2,
    );
  });
});
