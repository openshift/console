import * as React from 'react';
import * as _ from 'lodash';
import { Button, Split, SplitItem, Bullseye } from '@patternfly/react-core';
import {
  K8sResourceKind,
  k8sPatch,
  K8sKind,
  SelfSubjectAccessReviewKind,
} from '@console/internal/module/k8s';
import { AngleUpIcon, AngleDownIcon } from '@patternfly/react-icons';
import { checkPodEditAccess } from '../../utils';
import { Pod } from '../../types';
import PodStatus from './PodStatus';
import './PodRing.scss';

interface PodRingProps {
  pods: Pod[];
  obj: K8sResourceKind;
  resourceKind: K8sKind;
  path: string;
  impersonate?: string;
}

const PodRing: React.FC<PodRingProps> = ({ pods, obj, resourceKind, path, impersonate }) => {
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

  const isKnative = _.get(obj, 'metadata.ownerReferences[0].kind') === 'Revision';

  return (
    <Split>
      <SplitItem>
        <div className="odc-pod-ring">
          <PodStatus
            standalone
            data={pods}
            subTitle={
              obj.spec.replicas !== obj.status.availableReplicas
                ? !obj.spec.replicas
                  ? `pod`
                  : `scaling to ${obj.spec.replicas}`
                : obj.spec.replicas > 1
                ? 'pods'
                : 'pod'
            }
            title={obj.status.availableReplicas || '0'}
          />
        </div>
      </SplitItem>
      {!isKnative &&
        (editable && (
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
        ))}
    </Split>
  );
};

export default PodRing;
