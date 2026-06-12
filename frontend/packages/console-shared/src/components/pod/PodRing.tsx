import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Button, Split, SplitItem, Bullseye, Tooltip } from '@patternfly/react-core';
import { RhUiCaretDownIcon, RhUiCaretUpIcon, RhUiAutomationIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { ImpersonateKind } from '@console/dynamic-plugin-sdk';
import type { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { k8sPatch } from '@console/internal/module/k8s';
import { useNonScalableImageCheck } from '../../hooks/useNonScalableImageCheck';
import { useRelatedHPA } from '../../hooks/useRelatedHPA';
import type { ExtPodKind } from '../../types/pod';
import { usePodRingLabel, usePodScalingAccessStatus } from '../../utils/pod-ring-utils';
import { PodStatus } from './PodStatus';
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

export const PodRing: FC<PodRingProps> = ({
  pods,
  obj,
  resourceKind,
  path,
  impersonate,
  rc,
  enableScaling = true,
}) => {
  const [clickCount, setClickCount] = useState(obj.spec.replicas);
  const { t } = useTranslation('console-shared');
  const isAccessScalingAllowed = usePodScalingAccessStatus(
    obj,
    resourceKind,
    pods,
    enableScaling,
    impersonate,
  );

  useEffect(
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
  const { isNonScalable } = useNonScalableImageCheck(obj);

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
            icon={<RhUiAutomationIcon />}
            onClick={() => handleClick(1)}
          >
            {t('Enable Autoscale')}
          </Button>
        </SplitItem>
      )}
      {isScalingAllowed && (
        <SplitItem>
          <Bullseye>
            <div>
              {(() => {
                const scaleUpButton = (
                  <Button
                    icon={<RhUiCaretUpIcon style={{ fontSize: '20' }} />}
                    type="button"
                    variant="plain"
                    aria-label={t('Increase the Pod count')}
                    title={t('Increase the Pod count')}
                    onClick={() => handleClick(1)}
                    isBlock
                  />
                );
                // Show tooltip preemptively at >= 1 replica so users see
                // the non-scalable warning before attempting to scale up
                return isNonScalable && clickCount >= 1 ? (
                  <Tooltip
                    content={t(
                      'console-shared~This image is not intended to run with more than one replica. Scaling up is not supported and might cause issues.',
                    )}
                  >
                    {scaleUpButton}
                  </Tooltip>
                ) : (
                  scaleUpButton
                );
              })()}
              <Button
                icon={<RhUiCaretDownIcon style={{ fontSize: '20' }} />}
                type="button"
                variant="plain"
                aria-label={t('Decrease the Pod count')}
                title={t('Decrease the Pod count')}
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
