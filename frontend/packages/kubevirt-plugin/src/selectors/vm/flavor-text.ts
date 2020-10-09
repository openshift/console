import { CPURaw } from '../../types/vm';
import { vCPUCount } from './cpu';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { convertToBytes } from '../../components/form/size-unit-utils';
import { toUIFlavorLabel } from '../vm-like/flavor';

export const humanizeMemory = (memory: string): string => {
  const memoryBase = convertToBytes(memory);
  return humanizeBinaryBytes(memoryBase).string;
};

export const getFlavorText = ({
  cpu,
  memory,
  flavor,
}: {
  cpu: CPURaw;
  memory: string;
  flavor: string;
}) => {
  const vcpusCount = vCPUCount(cpu);
  const vcpusText = `${vcpusCount} vCPU${vcpusCount > 1 ? 's' : ''}`;

  const memoryText = humanizeMemory(memory);

  return `${toUIFlavorLabel(flavor)}: ${vcpusText}, ${memoryText} Memory`;
};
