import type { FC } from 'react';
import { useMemo } from 'react';
import { Split, SplitItem, Bullseye, Icon } from '@patternfly/react-core';
import { LongArrowAltRightIcon } from '@patternfly/react-icons/dist/esm/icons/long-arrow-alt-right-icon';
import { t_color_gray_50 as color200 } from '@patternfly/react-tokens';
import type { PodRingSetProps } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { LoadingInline } from '@console/internal/components/utils/status-box';
import { modelFor } from '@console/internal/module/k8s';
import { usePodsWatcher } from '../../hooks/usePodsWatcher';
import { getPodData } from '../../utils';
import PodRing from './PodRing';

const PodRingSet: FC<PodRingSetProps> = ({ obj, path }) => {
  const { podData, loadError, loaded } = usePodsWatcher(obj);
  const resourceKind = modelFor(obj?.kind);

  const deploymentData = useMemo(() => {
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
          rc={podData?.isRollingOut ? completedRC : podData?.current?.obj}
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
              <Icon size="xl">
                <LongArrowAltRightIcon color={color200.value} />
              </Icon>
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
