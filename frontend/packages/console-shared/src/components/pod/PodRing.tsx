import * as React from 'react';
import * as _ from 'lodash';
import { Button, Split, SplitItem, Bullseye } from '@patternfly/react-core';
import {
  K8sResourceKind,
  k8sPatch,
  K8sKind,
  SelfSubjectAccessReviewKind,
} from '@console/internal/module/k8s';
import { ChartLabel } from '@patternfly/react-charts';
import { AngleUpIcon, AngleDownIcon } from '@patternfly/react-icons';
import { checkPodEditAccess, podRingLabel } from '../../utils';
import { ExtPodKind } from '../../types';
import PodStatus from './PodStatus';
import './PodRing.scss';

interface PodRingProps {
  pods: ExtPodKind[];
  obj: K8sResourceKind;
  rc?: K8sResourceKind;
  resourceKind: K8sKind;
  path: string;
  impersonate?: string;
  enableScaling?: boolean;
}

const PodRing: React.FC<PodRingProps> = ({
  pods,
  obj,
  resourceKind,
  path,
  impersonate,
  rc,
  enableScaling = true,
}) => {
  const [editable, setEditable] = React.useState(false);
  const [clickCount, setClickCount] = React.useState(obj.spec.replicas);
  React.useEffect(() => {
    checkPodEditAccess(obj, resourceKind, impersonate)
      .then((resp: SelfSubjectAccessReviewKind) => setEditable(resp.status.allowed))
      .catch((error) => {
        throw error;
      });
  }, [pods, obj, resourceKind, impersonate]);

  const handleScaling = _.debounce(
    (operation: number) => {
      const patch = [{ op: 'replace', path, value: operation }];
      const promise: Promise<K8sResourceKind> = k8sPatch(resourceKind, obj, patch);
      promise.catch((error) => {
        throw error;
      });
    },
    1000,
    {
      leading: true,
      trailing: false,
    },
  );

  const handleClick = (operation: number) => {
    setClickCount(clickCount + operation);
    handleScaling(clickCount + operation);
  };

  const isKnativeRevision = obj.kind === 'Revision';
  const isScalingAllowed = !isKnativeRevision && editable && enableScaling;
  const resourceObj = rc || obj;
  const { title, subTitle } = podRingLabel(resourceObj, isScalingAllowed);

  return (
    <Split>
      <SplitItem>
        <div className="odc-pod-ring">
          <PodStatus
            standalone
            data={pods}
            subTitle={subTitle}
            {...!isScalingAllowed && {
              subTitleComponent: <ChartLabel style={{ fontSize: '14px' }} />,
            }}
            title={title}
            {...!resourceObj.status.availableReplicas && {
              titleComponent: <ChartLabel style={{ fontSize: '14px' }} />,
            }}
          />
        </div>
      </SplitItem>
      {isScalingAllowed && (
        <SplitItem>
          <Bullseye>
            <div>
              <Button
                type="button"
                variant="plain"
                aria-label="Increase the pod count"
                title="Increase the pod count"
                onClick={() => handleClick(1)}
                isBlock
              >
                <AngleUpIcon style={{ fontSize: '20' }} />
              </Button>
              <Button
                type="button"
                variant="plain"
                aria-label="Decrease the pod count"
                title="Decrease the pod count"
                onClick={() => handleClick(-1)}
                isBlock
                isDisabled={clickCount <= 0}
              >
                <AngleDownIcon style={{ fontSize: '20' }} />
              </Button>
            </div>
          </Bullseye>
        </SplitItem>
      )}
    </Split>
  );
};

export default PodRing;
