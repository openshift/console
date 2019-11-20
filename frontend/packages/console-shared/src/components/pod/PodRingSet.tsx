import * as React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { Split, SplitItem, Bullseye } from '@patternfly/react-core';
import { LongArrowAltRightIcon } from '@patternfly/react-icons';
import { global_Color_200 as color200 } from '@patternfly/react-tokens';
import { PodRCData } from '../../types';
import { getPodData } from '../../utils';
import PodRing from './PodRing';
import './PodRingSet.scss';

interface PodRingSetProps {
  podData: PodRCData;
  obj: K8sResourceKind;
  resourceKind: K8sKind;
  path: string;
  impersonate?: string;
}

const PodRingSet: React.FC<PodRingSetProps> = ({ podData, resourceKind, obj, path }) => {
  const { inProgressDeploymentData, completedDeploymentData } = getPodData(
    obj,
    podData.pods,
    podData.current,
    podData.previous,
    podData.isRollingOut,
  );
  const current = podData.current && podData.current.obj;
  const previous = podData.previous && podData.previous.obj;
  const progressRC = inProgressDeploymentData && current;
  const completedRC = !!inProgressDeploymentData && completedDeploymentData ? previous : current;
  return (
    <Split gutter="lg">
      <CSSTransition
        key={inProgressDeploymentData ? 'deploy-donut' : 'notDeploy-donut'}
        timeout={500}
        in={false}
        enter={false}
        exit
        classNames="odc-pod-ring-set__donut-completed"
      >
        <SplitItem>
          <PodRing
            key={inProgressDeploymentData ? 'deploy' : 'notDeploy'}
            pods={completedDeploymentData}
            rc={completedRC}
            resourceKind={resourceKind}
            obj={obj}
            path={path}
            enableScaling={!podData.isRollingOut}
          />
        </SplitItem>
      </CSSTransition>
      <TransitionGroup component={null}>
        {inProgressDeploymentData && (
          <CSSTransition key="arrow-animation" timeout={1000} classNames="odc-pod-ring-set__arrow">
            <SplitItem>
              <Bullseye>
                <LongArrowAltRightIcon size="xl" color={color200.value} />
              </Bullseye>
            </SplitItem>
          </CSSTransition>
        )}
      </TransitionGroup>
      <TransitionGroup component={null}>
        {inProgressDeploymentData && (
          <CSSTransition
            key="donut-animation"
            appear
            timeout={5000}
            classNames="odc-pod-ring-set__donut"
          >
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
          </CSSTransition>
        )}
      </TransitionGroup>
    </Split>
  );
};

export default PodRingSet;
/**
 *
 */
