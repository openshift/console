import * as React from 'react';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { Split, SplitItem, Bullseye } from '@patternfly/react-core';
import { LongArrowAltRightIcon } from '@patternfly/react-icons';
import { global_Color_200 as color200 } from '@patternfly/react-tokens/dist/js/global_Color_200';
import { PodRCData } from '../../types';
import { getPodData } from '../../utils';
import PodRing from './PodRing';

interface PodRingSetProps {
  podData: PodRCData;
  obj: K8sResourceKind;
  resourceKind: K8sKind;
  path: string;
  impersonate?: string;
}

const PodRingSet: React.FC<PodRingSetProps> = ({ podData, resourceKind, obj, path }) => {
  const { inProgressDeploymentData, completedDeploymentData } = getPodData({ ...podData, obj });
  const current = podData.current && podData.current.obj;
  const previous = podData.previous && podData.previous.obj;
  const progressRC = inProgressDeploymentData && current;
  const completedRC = !!inProgressDeploymentData && completedDeploymentData ? previous : current;
  return (
    <Split hasGutter>
      <SplitItem>
        <PodRing
          key={inProgressDeploymentData ? 'deploy' : 'notDeploy'}
          pods={completedDeploymentData}
          rc={podData.isRollingOut ? completedRC : undefined}
          resourceKind={resourceKind}
          obj={obj}
          path={path}
          enableScaling={!podData.isRollingOut}
        />
      </SplitItem>
      {inProgressDeploymentData && (
        <>
          <SplitItem>
            <Bullseye>
              <LongArrowAltRightIcon size="xl" color={color200.value} />
            </Bullseye>
          </SplitItem>
          <SplitItem>
            <PodRing
              pods={inProgressDeploymentData}
              rc={progressRC}
              resourceKind={resourceKind}
              obj={obj}
              path={path}
              enableScaling={false}
            />
          </SplitItem>
        </>
      )}
    </Split>
  );
};

export default PodRingSet;
