import { CPURaw } from '../../types/vm';
import { vCPUCount } from './cpu';
import { convertToBaseValue, humanizeBinaryBytes } from '@console/internal/components/utils';
import * as _ from 'lodash';

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

  const memoryBase = convertToBaseValue(memory);
  const memoryText = humanizeBinaryBytes(memoryBase).string;

  return `${_.capitalize(flavor) || ''}${flavor ? ': ' : ''}${vcpusText}, ${memoryText} Memory`;
};
