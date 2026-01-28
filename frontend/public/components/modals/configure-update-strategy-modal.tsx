import * as _ from 'lodash';
import { useCallback, useState } from 'react';
import type { FC } from 'react';
import {
  FormGroup,
  FormHelperText,
  FormSection,
  HelperText,
  HelperTextItem,
  InputGroup,
  InputGroupItem,
  InputGroupText,
  Radio,
  TextInput,
  Tooltip,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { k8sPatch, Patch, DeploymentUpdateStrategy, K8sResourceKind } from '../../module/k8s';
import { DeploymentModel } from '../../models';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalWrapper,
  ModalComponentProps,
} from '../factory/modal';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const getNumberOrPercent = (value) => {
  if (typeof value === 'undefined') {
    return null;
  }
  if (typeof value === 'string' && value.indexOf('%') > -1) {
    return value;
  }

  return _.toInteger(value);
};

export const ConfigureUpdateStrategy: FC<ConfigureUpdateStrategyProps> = ({
  showDescription = true,
  strategyType,
  uid,
  onChangeStrategyType,
  maxUnavailable,
  onChangeMaxUnavailable,
  replicas,
  maxSurge,
  onChangeMaxSurge,
}) => {
  const { t } = useTranslation();
  const strategyIsNotRollingUpdate = strategyType !== 'RollingUpdate';
  return (
    <div className="pf-v6-c-form pf-m-horizontal">
      {showDescription && (
        <FormSection>
          {t('public~How should the pods be replaced when a new revision is created?')}
        </FormSection>
      )}

      <Radio
        id={`${uid || 'update-strategy'}-rolling-update`}
        data-test="rolling-update-strategy-radio"
        name={`${uid || 'update-strategy'}-type`}
        onChange={(_e, value) => {
          onChangeStrategyType(value ? 'RollingUpdate' : 'Recreate');
        }}
        value="RollingUpdate"
        checked={strategyType === 'RollingUpdate'}
        label={`${t('public~RollingUpdate')} (${t('public~default')})`}
        description={t(
          'public~Execute a smooth roll out of the new revision, based on the settings below',
        )}
        autoFocus={strategyType === 'RollingUpdate'}
        body={
          <FormSection>
            <FormGroup label={t('public~Max unavailable')} fieldId="input-max-unavailable">
              <InputGroup>
                <InputGroupItem isFill>
                  <TextInput
                    isDisabled={strategyIsNotRollingUpdate}
                    id="input-max-unavailable"
                    placeholder="25%"
                    name="maxUnavailable"
                    type="text"
                    value={maxUnavailable}
                    onChange={(_e, value) => onChangeMaxUnavailable(value)}
                    aria-describedby="input-max-unavailable-help"
                    data-test="max-unavailable-input"
                  />
                </InputGroupItem>
                <Tooltip content={t('public~Current desired pod count')}>
                  <InputGroupText className="pf-v6-c-input-group__text">
                    {t('public~of pod', { count: replicas })}
                  </InputGroupText>
                </Tooltip>
              </InputGroup>
              <FormHelperText>
                <HelperText>
                  <HelperTextItem id="input-max-unavailable-help">
                    {t(
                      'public~Percentage of total number of pods or the maximum number ' +
                        'of pods that can be unavailable during the update(optional)',
                    )}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>

            <FormGroup label={t('public~Max surge')} fieldId="input-max-surge">
              <InputGroup>
                <InputGroupItem isFill>
                  <TextInput
                    isDisabled={strategyIsNotRollingUpdate}
                    id="input-max-surge"
                    name="max-surge"
                    type="text"
                    placeholder="25%"
                    value={maxSurge}
                    onChange={(_e, value) => onChangeMaxSurge(value)}
                    aria-describedby="input-max-surge-help"
                    data-test="max-surge-input"
                  />
                </InputGroupItem>
                <Tooltip content={t('public~Current desired pod count')}>
                  <InputGroupText className="pf-v6-c-input-group__text">
                    {t('public~greater than pod', { count: replicas })}
                  </InputGroupText>
                </Tooltip>
              </InputGroup>
              <FormHelperText>
                <HelperText>
                  <HelperTextItem id="input-max-surge-help">
                    {t(
                      'public~Percentage of total number of pods or the maximum number ' +
                        'of pods that can be scheduled above the original number of pods(optional)',
                    )}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
          </FormSection>
        }
      />

      <Radio
        id={`${uid || 'update-strategy'}-recreate`}
        name={`${uid || 'update-strategy'}-type`}
        onChange={(_e, value) => {
          onChangeStrategyType(value ? 'Recreate' : 'RollingUpdate');
        }}
        value="Recreate"
        checked={strategyType === 'Recreate'}
        label={t('public~Recreate')}
        description={t('public~Shut down all existing pods before creating new ones')}
        autoFocus={strategyType === 'Recreate'}
        data-test="recreate-update-strategy-radio"
      />
    </div>
  );
};

export const ConfigureUpdateStrategyModal = ({
  deployment,
  cancel,
  close,
}: ConfigureUpdateStrategyModalProps) => {
  const [strategyType, setStrategyType] = useState(_.get(deployment.spec, 'strategy.type'));
  const [maxUnavailable, setMaxUnavailable] = useState(
    _.get(deployment.spec, 'strategy.rollingUpdate.maxUnavailable', '25%'),
  );
  const [maxSurge, setMaxSurge] = useState(
    _.get(deployment.spec, 'strategy.rollingUpdate.maxSurge', '25%'),
  );
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const { t } = useTranslation();

  const submit = useCallback(
    (event) => {
      event.preventDefault();

      const patch: Patch = { path: '/spec/strategy/rollingUpdate', op: 'remove' };
      if (strategyType === 'RollingUpdate') {
        patch.value = {
          maxUnavailable: getNumberOrPercent(maxUnavailable || '25%'),
          maxSurge: getNumberOrPercent(maxSurge || '25%'),
        };
        patch.op = 'add';
      }
      const promise = k8sPatch(DeploymentModel, deployment, [
        patch,
        { path: '/spec/strategy/type', value: strategyType, op: 'replace' },
      ]);
      handlePromise(promise).then(() => close());
    },
    [strategyType, maxUnavailable, maxSurge, deployment, close, handlePromise],
  );

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{t('public~Edit update strategy')}</ModalTitle>
      <ModalBody>
        <ConfigureUpdateStrategy
          strategyType={strategyType}
          maxUnavailable={maxUnavailable}
          maxSurge={maxSurge}
          onChangeStrategyType={setStrategyType}
          onChangeMaxUnavailable={setMaxUnavailable}
          onChangeMaxSurge={setMaxSurge}
          replicas={deployment.spec.replicas}
        />
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={inProgress}
        submitText={t('public~Save')}
        cancel={cancel}
      />
    </form>
  );
};

export const ConfigureUpdateStrategyModalOverlay: OverlayComponent<ConfigureUpdateStrategyModalProps> = (
  props,
) => {
  return (
    <ModalWrapper blocking onClose={props.closeOverlay}>
      <ConfigureUpdateStrategyModal
        {...props}
        cancel={props.closeOverlay}
        close={props.closeOverlay}
      />
    </ModalWrapper>
  );
};

export type ConfigureUpdateStrategyProps = {
  showDescription?: boolean;
  strategyType: DeploymentUpdateStrategy['type'];
  maxUnavailable: number | string;
  maxSurge: number | string;
  onChangeStrategyType: (strategy: DeploymentUpdateStrategy['type']) => void;
  onChangeMaxUnavailable: (maxUnavailable: number | string) => void;
  onChangeMaxSurge: (maxSurge: number | string) => void;
  replicas?: number;
  uid?: string;
};

export type ConfigureUpdateStrategyModalProps = {
  deployment: K8sResourceKind;
} & ModalComponentProps;

ConfigureUpdateStrategy.displayName = 'ConfigureUpdateStrategy';
