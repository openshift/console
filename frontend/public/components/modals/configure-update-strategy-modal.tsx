import * as _ from 'lodash-es';
import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { k8sPatch, Patch, DeploymentUpdateStrategy, K8sResourceKind } from '../../module/k8s';
import { DeploymentModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { withHandlePromise, HandlePromiseProps } from '../utils';
import { RadioInput } from '../radio';
import i18next from 'i18next';

export const UPDATE_STRATEGY_DESCRIPTION = i18next.t(
  'modal~How should the pods be replaced when a new revision is created?',
);

export const getNumberOrPercent = (value) => {
  if (typeof value === 'undefined') {
    return null;
  }
  if (typeof value === 'string' && value.indexOf('%') > -1) {
    return value;
  }

  return _.toInteger(value);
};

export const ConfigureUpdateStrategy: React.FC<ConfigureUpdateStrategyProps> = (props) => {
  const { t } = useTranslation();
  const { showDescription = true } = props;
  return (
    <>
      {showDescription && (
        <div className="co-m-form-row">
          <p>{t('public~How should the pods be replaced when a new revision is created?')}</p>
        </div>
      )}
      <div className="row co-m-form-row">
        <div className="col-sm-12">
          <RadioInput
            name={`${props.uid || 'update-strategy'}-type`}
            onChange={(e) => {
              props.onChangeStrategyType(e.target.value);
            }}
            value="RollingUpdate"
            checked={props.strategyType === 'RollingUpdate'}
            title={t('modal~RollingUpdate')}
            subTitle={t('modal~(default)')}
            autoFocus={props.strategyType === 'RollingUpdate'}
          >
            <div className="co-m-radio-desc">
              <p className="text-muted">
                {t(
                  'modal~Execute a smooth roll out of the new revision, based on the settings below',
                )}
              </p>

              <div className="row co-m-form-row">
                <div className="col-sm-3">
                  <label htmlFor="input-max-unavailable" className="control-label">
                    {t('modal~Max Unavailable')}
                  </label>
                </div>
                <div className="co-m-form-col col-sm-9">
                  <div className="form-inline">
                    <div className="pf-c-input-group">
                      <input
                        disabled={props.strategyType !== 'RollingUpdate'}
                        placeholder="25%"
                        size={5}
                        type="text"
                        className="pf-c-form-control"
                        id="input-max-unavailable"
                        value={props.maxUnavailable}
                        onChange={(e) => props.onChangeMaxUnavailable(e.target.value)}
                        aria-describedby="input-max-unavailable-help"
                      />
                      {props.replicas && (
                        <span className="pf-c-input-group__text">
                          <Tooltip content={t('modal~Current desired pod count')}>
                            <span>
                              {t('modal~of {{pods}}', { pods: pluralize(props.replicas, 'pod') })}
                            </span>
                          </Tooltip>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="help-block text-muted" id="input-max-unavailable-help">
                    {t(
                      'modal~Number or percentage of total pods at the start of the update (optional)',
                    )}
                  </p>
                </div>
              </div>

              <div className="row co-m-form-row">
                <div className="col-sm-3">
                  <label htmlFor="input-max-surge" className="control-label">
                    {t('modal~Max Surge')}
                  </label>
                </div>
                <div className="co-m-form-col col-sm-9">
                  <div className="form-inline">
                    <div className="pf-c-input-group">
                      <input
                        disabled={props.strategyType !== 'RollingUpdate'}
                        placeholder="25%"
                        size={5}
                        type="text"
                        className="pf-c-form-control"
                        id="input-max-surge"
                        value={props.maxSurge}
                        onChange={(e) => props.onChangeMaxSurge(e.target.value)}
                        aria-describedby="input-max-surge-help"
                      />
                      <span className="pf-c-input-group__text">
                        <Tooltip content={t('modal~Current desired pod count')}>
                          <span>
                            {t('modal~greater than {{pods}}', {
                              pods: pluralize(props.replicas, 'pod'),
                            })}
                          </span>
                        </Tooltip>
                      </span>
                    </div>
                  </div>
                  <p className="help-block text-muted" id="input-max-surge-help">
                    {t(
                      'modal~Number or percentage of total pods at the start of the update (optional)',
                    )}
                  </p>
                </div>
              </div>
            </div>
          </RadioInput>
        </div>

        <div className="col-sm-12">
          <RadioInput
            name={`${props.uid || 'update-strategy'}-type`}
            onChange={(e) => {
              props.onChangeStrategyType(e.target.value);
            }}
            value="Recreate"
            checked={props.strategyType === 'Recreate'}
            title={t('modal~Recreate')}
            desc={t('modal~Shut down all existing pods before creating new ones')}
            autoFocus={props.strategyType === 'Recreate'}
          />
        </div>
      </div>
    </>
  );
};

export const ConfigureUpdateStrategyModal = withHandlePromise(
  (props: ConfigureUpdateStrategyModalProps) => {
    const [strategyType, setStrategyType] = React.useState(
      _.get(props.deployment.spec, 'strategy.type'),
    );
    const [maxUnavailable, setMaxUnavailable] = React.useState(
      _.get(props.deployment.spec, 'strategy.rollingUpdate.maxUnavailable', '25%'),
    );
    const [maxSurge, setMaxSurge] = React.useState(
      _.get(props.deployment.spec, 'strategy.rollingUpdate.maxSurge', '25%'),
    );

    const { t } = useTranslation();

    const submit = (event) => {
      event.preventDefault();

      const patch: Patch = { path: '/spec/strategy/rollingUpdate', op: 'remove' };
      if (strategyType === 'RollingUpdate') {
        patch.value = {
          maxUnavailable: getNumberOrPercent(maxUnavailable || '25%'),
          maxSurge: getNumberOrPercent(maxSurge || '25%'),
        };
        patch.op = 'add';
      }
      const promise = k8sPatch(DeploymentModel, props.deployment, [
        patch,
        { path: '/spec/strategy/type', value: strategyType, op: 'replace' },
      ]);
      props.handlePromise(promise, props.close);
    };

    const { t } = useTranslation();
    return (
      <form onSubmit={submit} name="form" className="modal-content">
        <ModalTitle>{t('modal~Edit Update Strategy')}</ModalTitle>
        <ModalBody>
          <ConfigureUpdateStrategy
            strategyType={strategyType}
            maxUnavailable={maxUnavailable}
            maxSurge={maxSurge}
            onChangeStrategyType={setStrategyType}
            onChangeMaxUnavailable={setMaxUnavailable}
            onChangeMaxSurge={setMaxSurge}
          />
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={props.errorMessage}
          inProgress={props.inProgress}
          submitText={t('modal~Save')}
          cancel={props.cancel}
        />
      </form>
    );
  },
);

export const configureUpdateStrategyModal = createModalLauncher(ConfigureUpdateStrategyModal);

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
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
  inProgress: boolean;
  errorMessage: string;
  cancel?: () => void;
  close?: () => void;
} & HandlePromiseProps;

ConfigureUpdateStrategy.displayName = 'ConfigureUpdateStrategy';
