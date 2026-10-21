import { doesHpaMatch } from '../hpa-utils';
import {
  deploymentHasCpuAndMemoryLimits,
  deploymentConfigHasCpuAndMemoryLimits,
  cpuScaled,
} from './hpa-utils-data';

describe('doesHpaMatch checks if it aligns to a workload', () => {
  it('expect not to match when hpa does not target workload', () => {
    expect(doesHpaMatch(deploymentHasCpuAndMemoryLimits)(cpuScaled)).toBe(false);
  });

  it('expect to match when hpa does target workload', () => {
    expect(doesHpaMatch(deploymentConfigHasCpuAndMemoryLimits)(cpuScaled)).toBe(true);
  });
});
