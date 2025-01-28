import * as React from 'react';
import { Button, Split, SplitItem, Bullseye } from '@patternfly/react-core';
import { AngleDownIcon } from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import { AngleUpIcon } from '@patternfly/react-icons/dist/esm/icons/angle-up-icon';
import { AutomationIcon } from '@patternfly/react-icons/dist/esm/icons/automation-icon';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ImpersonateKind } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind, k8sPatch, K8sKind } from '@console/internal/module/k8s';
import { useRelatedHPA } from '../../hooks/hpa-hooks';
import { ExtPodKind } from '../../types';
import { usePodRingLabel, usePodScalingAccessStatus } from '../../utils';
import PodStatus from './PodStatus';
import './PodRing.scss';

interface PodRingProps {
  pods: ExtPodKind[];
  obj: K8sResourceKind;
  rc?: K8sResourceKind;
  resourceKind: K8sKind;
  path?: string;
  impersonate?: ImpersonateKind;
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
  const { t } = useTranslation();
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
      const opts = { path: 'scale' };
      const promise: Promise<K8sResourceKind> = k8sPatch(resourceKind, obj, patch, opts);
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

  const enableAutoscaling = !isScalingAllowed && clickCount === 0;
  const resourceObj = rc || obj;
  const { title, subTitle, titleComponent } = usePodRingLabel(
    resourceObj,
    kind,
    pods,
    hpaControlledScaling,
    t,
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
      {enableAutoscaling && (
        <SplitItem className="pf-v6-u-display-flex pf-v6-u-align-content-center">
          <Button
            type="button"
            variant="link"
            data-test="enable-autoscale"
            icon={<AutomationIcon />}
            onClick={() => handleClick(1)}
          >
            {t('console-shared~Enable Autoscale')}
          </Button>
        </SplitItem>
      )}
      {isScalingAllowed && (
        <SplitItem>
          <Bullseye>
            <div>
              <Button
                icon={<AngleUpIcon style={{ fontSize: '20' }} />}
                type="button"
                variant="plain"
                aria-label={t('console-shared~Increase the Pod count')}
                title={t('console-shared~Increase the Pod count')}
                onClick={() => handleClick(1)}
                isBlock
              />
              <Button
                icon={<AngleDownIcon style={{ fontSize: '20' }} />}
                type="button"
                variant="plain"
                aria-label={t('console-shared~Decrease the Pod count')}
                title={t('console-shared~Decrease the Pod count')}
                onClick={() => handleClick(-1)}
                isBlock
                isDisabled={clickCount <= 0}
              />
            </div>
          </Bullseye>
        </SplitItem>
      )}
    </Split>
  );
};

export default PodRing;
