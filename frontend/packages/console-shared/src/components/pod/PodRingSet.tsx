import * as React from 'react';
import { Split, SplitItem, Bullseye } from '@patternfly/react-core';
import { LongArrowAltRightIcon } from '@patternfly/react-icons';
import { global_Color_200 as color200 } from '@patternfly/react-tokens/dist/js/global_Color_200';
import { LoadingInline } from '@console/internal/components/utils';
import { K8sResourceKind, modelFor } from '@console/internal/module/k8s';
import { usePodsWatcher } from '../../hooks';
import { getPodData } from '../../utils';
import PodRing from './PodRing';

interface PodRingSetProps {
  obj: K8sResourceKind;
  path: string;
  impersonate?: string;
}

const PodRingSet: React.FC<PodRingSetProps> = ({ obj, path }) => {
  const { podData, loadError, loaded } = usePodsWatcher(obj);
  const resourceKind = modelFor(obj?.kind);

  const deploymentData = React.useMemo(() => {
    return loaded && !loadError
      ? getPodData({ ...podData, obj })
      : { inProgressDeploymentData: null, completedDeploymentData: null };
  }, [loadError, loaded, podData, obj]);

  const current = podData?.current && podData?.current.obj;
  const previous = podData?.previous && podData?.previous.obj;
  const { inProgressDeploymentData, completedDeploymentData } = deploymentData;
  const progressRC = inProgressDeploymentData && current;
  const completedRC = !!inProgressDeploymentData && completedDeploymentData ? previous : current;

  return loaded ? (
    <Split hasGutter>
      <SplitItem>
        <PodRing
          key={inProgressDeploymentData ? 'deploy' : 'notDeploy'}
          pods={completedDeploymentData}
          rc={podData?.isRollingOut ? completedRC : undefined}
          resourceKind={resourceKind}
          obj={obj}
          path={path}
          enableScaling={!podData?.isRollingOut}
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
  ) : (
    <LoadingInline />
  );
};

export default PodRingSet;
