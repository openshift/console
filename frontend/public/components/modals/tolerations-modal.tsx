import * as _ from 'lodash-es';
import * as React from 'react';
import classnames from 'classnames';
import { Button, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useTranslation } from 'react-i18next';

import { Dropdown, EmptyBox, withHandlePromise, HandlePromiseProps } from '../utils';
import { K8sKind, k8sPatch, Toleration, TolerationOperator } from '../../module/k8s';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory';

const TolerationsModal = withHandlePromise((props: TolerationsModalProps) => {
  const getTolerationsFromResource = (): Toleration[] => {
    const { resource } = props;
    return props.resourceKind.kind === 'Pod'
      ? resource.spec.tolerations
      : resource.spec.template.spec.tolerations;
  };

  const [tolerations, setTolerations] = React.useState<Toleration[]>(
    getTolerationsFromResource() || [],
  );

  const { t } = useTranslation();

  const operators = {
    Exists: 'Exists',
    Equal: 'Equal',
  };

  const effects = {
    '': 'All Effects',
    NoSchedule: 'NoSchedule',
    PreferNoSchedule: 'PreferNoSchedule',
    NoExecute: 'NoExecute',
  };

  const submit = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();

    const path =
      props.resourceKind.kind === 'Pod' ? '/spec/tolerations' : '/spec/template/spec/tolerations';

    // Remove the internal `isNew` property
    const submittedTolerations = _.map(tolerations, (toleration) => _.omit(toleration, 'isNew'));

    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = _.isEmpty(getTolerationsFromResource()) ? 'replace' : 'add';

    const patch = [{ path, op, value: submittedTolerations }];

    props.handlePromise(k8sPatch(props.resourceKind, props.resource, patch), props.close);
  };

  const cancel = () => {
    props.close();
  };

  const change = (e, i: number, field: string) => {
    const newValue = e.target ? e.target.value : e;

    setTolerations((prevTolerations) => {
      const clonedTolerations = _.cloneDeep(prevTolerations);
      clonedTolerations[i][field] = newValue;
      return clonedTolerations;
    });
  };

  const opChange = (op: TolerationOperator, i: number) => {
    setTolerations((prevTolerations) => {
      const clonedTolerations = _.cloneDeep(prevTolerations);
      clonedTolerations[i].operator = op;
      if (op === 'Exists') {
        clonedTolerations[i].value = '';
      }
      return clonedTolerations;
    });
  };

  const remove = (i: number) => {
    const tmpTolerations = [...tolerations];
    tmpTolerations.splice(i, 1);
    setTolerations(tmpTolerations);
  };

  const newToleration = (): TolerationModalItem => {
    return { key: '', operator: 'Exists', value: '', effect: '', isNew: true };
  };

  const addRow = () => {
    setTolerations([...tolerations, newToleration()]);
  };

  const isEditable = (toleration: TolerationModalItem) => {
    return props.resourceKind.kind !== 'Pod' || toleration.isNew;
  };

  const { errorMessage } = props;

  return (
    <form onSubmit={submit} name="form" className="modal-content toleration-modal">
      <ModalTitle>{t('public~Edit tolerations')}</ModalTitle>
      <ModalBody>
        {_.isEmpty(tolerations) ? (
          <EmptyBox label={t('public~Tolerations')} />
        ) : (
          <>
            <div className="row toleration-modal__heading hidden-sm hidden-xs">
              <div className="col-md-4 text-secondary text-uppercase">{t('public~Key')}</div>
              <div className="col-md-2 text-secondary text-uppercase">{t('public~Operator')}</div>
              <div className="col-md-3 text-secondary text-uppercase">{t('public~Value')}</div>
              <div className="col-md-2 text-secondary text-uppercase">{t('public~Effect')}</div>
              <div className="col-md-1" />
            </div>
            {_.map(tolerations, (toleration, i) => {
              const { key, operator, value, effect = '' } = toleration;
              const keyReadOnly = !isEditable(toleration);
              const valueReadOnly = !isEditable(toleration) || operator === 'Exists';
              return (
                <div className="row toleration-modal__row" key={i}>
                  <div className="col-md-4 col-sm-5 col-xs-5 toleration-modal__field">
                    <div className="toleration-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      {t('public~Key')}
                    </div>
                    <span
                      className={classnames('pf-v6-c-form-control', {
                        'pf-m-readonly': keyReadOnly,
                      })}
                    >
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => change(e, i, 'key')}
                        readOnly={keyReadOnly}
                      />
                    </span>
                  </div>
                  <div className="col-md-2 col-sm-5 col-xs-5 toleration-modal__field">
                    <div className="toleration-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      {t('public~Operator')}
                    </div>
                    {isEditable(toleration) ? (
                      <Dropdown
                        className="toleration-modal__dropdown"
                        dropDownClassName="dropdown--full-width"
                        items={operators}
                        onChange={(op: TolerationOperator) => opChange(op, i)}
                        selectedKey={operator}
                        title={operators[operator]}
                      />
                    ) : (
                      <span className="pf-v6-c-form-control pf-m-readonly">
                        <input type="text" value={operator} readOnly />
                      </span>
                    )}
                  </div>
                  <div className="clearfix visible-sm visible-xs" />
                  <div className="col-md-3 col-sm-5 col-xs-5 toleration-modal__field">
                    <div className="toleration-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      {t('public~Value')}
                    </div>
                    <span
                      className={classnames('pf-v6-c-form-control', {
                        'pf-m-readonly': valueReadOnly,
                      })}
                    >
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => change(e, i, 'value')}
                        readOnly={valueReadOnly}
                      />
                    </span>
                  </div>
                  <div className="col-md-2 col-sm-5 col-xs-5 toleration-modal__field">
                    <div className="toleration-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      {t('public~Effect')}
                    </div>
                    {isEditable(toleration) ? (
                      <Dropdown
                        className="toleration-modal__dropdown"
                        dropDownClassName="dropdown--full-width"
                        items={effects}
                        onChange={(e: string) => change(e, i, 'effect')}
                        selectedKey={effect}
                        title={effects[effect]}
                      />
                    ) : (
                      <span className="pf-v6-c-form-control pf-m-readonly">
                        <input type="text" value={effects[effect]} readOnly />
                      </span>
                    )}
                  </div>
                  <div className="col-md-1 col-sm-2 col-xs-2">
                    {isEditable(toleration) && (
                      <Tooltip content={t('public~Remove')}>
                        <Button
                          icon={
                            <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
                          }
                          type="button"
                          className="toleration-modal__delete-icon"
                          onClick={() => remove(i)}
                          aria-label={t('public~Remove')}
                          variant="plain"
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
        <Button
          icon={<PlusCircleIcon data-test-id="pairs-list__add-icon" className="co-icon-space-r" />}
          className="pf-m-link--align-left"
          onClick={addRow}
          type="button"
          variant="link"
        >
          {t('public~Add more')}
        </Button>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={false}
        submitText={t('public~Save')}
        cancel={cancel}
      />
    </form>
  );
});

export const tolerationsModal = createModalLauncher(TolerationsModal);

type TolerationModalItem = {
  // isNew is used internally in the dialog to track existing vs new
  // tolerations on pods and is not part of the k8s API
  isNew?: boolean;
} & Toleration;

export type TolerationsModalProps = {
  resourceKind: K8sKind;
  resource: any;
  existingReadOnly?: boolean;
  close?: () => void;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
} & ModalComponentProps &
  HandlePromiseProps;
