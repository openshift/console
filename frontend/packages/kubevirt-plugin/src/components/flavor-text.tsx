import * as React from 'react';
import * as _ from 'lodash';
import { getFlavor, vCPUCount, getCPU, getMemory, asVM } from '../selectors/vm';
import { VMLikeEntityKind } from '../types';

export const FlavorText: React.FC<FlavorTextProps> = (props) => {
  const { vmLike } = props;
  const vm = asVM(vmLike);

  const flavor = _.capitalize(getFlavor(vmLike));
  const vcpusCount = vCPUCount(getCPU(vm));
  const vcpusText = `${vcpusCount} vCPU${vcpusCount > 1 ? 's' : ''}`;
  return <>{`${flavor || ''}${flavor ? ': ' : ''}${vcpusText}, ${getMemory(vm)} Memory`}</>;
};

type FlavorTextProps = {
  vmLike: VMLikeEntityKind;
};
