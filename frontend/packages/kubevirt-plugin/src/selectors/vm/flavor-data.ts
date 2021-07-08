import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { convertToBytes } from '../../components/form/size-unit-utils';
import { CUSTOM_FLAVOR } from '../../constants';
import { CPURaw } from '../../types/vm';
import { toUIFlavorLabel } from '../vm-like/flavor';
import { vCPUCount } from './cpu';

export const humanizeMemory = (memory: string): string => {
  const memoryBase = convertToBytes(memory);
  return humanizeBinaryBytes(memoryBase).string;
};

export const getFlavorData = ({
  cpu,
  memory,
  flavor,
}: {
  cpu: CPURaw;
  memory: string;
  flavor?: string;
}) => {
  const cpuValue = vCPUCount(cpu);
  const memoryValue = humanizeMemory(memory);
  const flavorValue = flavor ? toUIFlavorLabel(flavor) : CUSTOM_FLAVOR;

  // must use 'count' for CPU to make it plural when translated by i18next
  return { flavor: flavorValue, count: cpuValue, memory: memoryValue };
};
