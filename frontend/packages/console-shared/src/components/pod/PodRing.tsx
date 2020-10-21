import * as React from 'react';
import * as _ from 'lodash';
import { Button, Split, SplitItem, Bullseye } from '@patternfly/react-core';
import { K8sResourceKind, k8sPatch, K8sKind } from '@console/internal/module/k8s';
import { AngleUpIcon, AngleDownIcon } from '@patternfly/react-icons';
import { useRelatedHPA } from '@console/dev-console/src/components/hpa/hooks';
import { usePodRingLabel, usePodScalingAccessStatus } from '../../utils';
import { ExtPodKind } from '../../types';
import PodStatus from './PodStatus';
import './PodRing.scss';

interface PodRingProps {
  pods: ExtPodKind[];
  obj: K8sResourceKind;
  rc?: K8sResourceKind;
  resourceKind: K8sKind;
  path?: string;
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
  const [clickCount, setClickCount] = React.useState(obj.spec.replicas);
  const isAccessScalingAllowed = usePodScalingAccessStatus(
    obj,
    resourceKind,
    pods,
    enableScaling,
    impersonate,
  );

  React.useEffect(
    () => {
      if (clickCount !== obj.spec.replicas) {
        setClickCount(obj.spec.replicas);
      }
    },
    // disabling exhaustive-deps because I do not want to add clickCount to
    // dependency array. I only want to trigger useEffect when `obj.spec.replicas` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [obj.spec.replicas],
  );

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

  const {
    apiVersion,
    kind,
    metadata: { name, namespace },
  } = obj;
  const [hpa] = useRelatedHPA(apiVersion, kind, name, namespace);
  const hpaControlledScaling = !!hpa;

  const isScalingAllowed = isAccessScalingAllowed && !hpaControlledScaling;

  const resourceObj = rc || obj;
  const { title, subTitle, titleComponent } = usePodRingLabel(
    resourceObj,
    kind,
    pods,
    hpaControlledScaling,
    hpa,
  );

  return (
    <Split>
      <SplitItem>
        <div className="odc-pod-ring">
          <PodStatus
            standalone
            data={pods}
            subTitle={subTitle}
            title={title}
            titleComponent={titleComponent}
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
