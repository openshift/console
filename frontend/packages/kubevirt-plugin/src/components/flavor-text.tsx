import * as _ from 'lodash';
import { convertToBaseValue, humanizeBinaryBytes } from '@console/internal/components/utils';
import { getFlavor, vCPUCount, getCPU, getMemory, asVM } from '../selectors/vm';
import { VMLikeEntityKind } from '../types';

export const getFlavorText = (vmLike: VMLikeEntityKind) => {
  const vm = asVM(vmLike);

  const flavor = _.capitalize(getFlavor(vmLike));

  const vcpusCount = vCPUCount(getCPU(vm));
  const vcpusText = `${vcpusCount} vCPU${vcpusCount > 1 ? 's' : ''}`;

  const memoryBase = convertToBaseValue(getMemory(vm));
  const memoryText = humanizeBinaryBytes(memoryBase).string;

  return `${flavor || ''}${flavor ? ': ' : ''}${vcpusText}, ${memoryText} Memory`;
};
