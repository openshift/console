import * as React from 'react';
import * as _ from 'lodash';
import { convertToBaseValue, humanizeDecimalBytes } from '@console/internal/components/utils';
import { getFlavor, vCPUCount, getCPU, getMemory, asVM } from '../selectors/vm';
import { VMLikeEntityKind } from '../types';

export const FlavorText: React.FC<FlavorTextProps> = (props) => {
  const { vmLike } = props;
  const vm = asVM(vmLike);

  const flavor = _.capitalize(getFlavor(vmLike));

  const vcpusCount = vCPUCount(getCPU(vm));
  const vcpusText = `${vcpusCount} vCPU${vcpusCount > 1 ? 's' : ''}`;

  const memoryBase = convertToBaseValue(getMemory(vm));
  const memoryText = humanizeDecimalBytes(memoryBase).string;

  return <>{`${flavor || ''}${flavor ? ': ' : ''}${vcpusText}, ${memoryText} Memory`}</>;
};

type FlavorTextProps = {
  vmLike: VMLikeEntityKind;
};
