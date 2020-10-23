import * as _ from 'lodash-es';
import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
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
  const [errorMessage] = React.useState();
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

  return (
    <form
      onSubmit={submit}
      name="form"
      className="modal-content modal-content--accommodate-dropdown toleration-modal"
    >
      <ModalTitle>{t('modal~Edit tolerations')}</ModalTitle>
      <ModalBody>
        {_.isEmpty(tolerations) ? (
          <EmptyBox label={t('modal~Tolerations')} />
        ) : (
          <>
            <div className="row toleration-modal__heading hidden-sm hidden-xs">
              <div className="col-md-4 text-secondary text-uppercase">{t('modal~Key')}</div>
              <div className="col-md-2 text-secondary text-uppercase">{t('modal~Operator')}</div>
              <div className="col-md-3 text-secondary text-uppercase">{t('modal~Value')}</div>
              <div className="col-md-2 text-secondary text-uppercase">{t('modal~Effect')}</div>
              <div className="col-md-1" />
            </div>
            {_.map(tolerations, (toleration, i) => {
              const { key, operator, value, effect = '' } = toleration;
              return (
                <div className="row toleration-modal__row" key={i}>
                  <div className="col-md-4 col-sm-5 col-xs-5 toleration-modal__field">
                    <div className="toleration-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      {t('modal~Key')}
                    </div>
                    <input
                      type="text"
                      className="pf-c-form-control"
                      value={key}
                      onChange={(e) => change(e, i, 'key')}
                      readOnly={!isEditable(toleration)}
                    />
                  </div>
                  <div className="col-md-2 col-sm-5 col-xs-5 toleration-modal__field">
                    <div className="toleration-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      {t('modal~Operator')}
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
                      <input type="text" className="pf-c-form-control" value={operator} readOnly />
                    )}
                  </div>
                  <div className="clearfix visible-sm visible-xs" />
                  <div className="col-md-3 col-sm-5 col-xs-5 toleration-modal__field">
                    <div className="toleration-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      {t('modal~Value')}
                    </div>
                    <input
                      type="text"
                      className="pf-c-form-control"
                      value={value}
                      onChange={(e) => change(e, i, 'value')}
                      readOnly={!isEditable(toleration) || operator === 'Exists'}
                    />
                  </div>
                  <div className="col-md-2 col-sm-5 col-xs-5 toleration-modal__field">
                    <div className="toleration-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                      {t('modal~Effect')}
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
                      <input
                        type="text"
                        className="pf-c-form-control"
                        value={effects[effect]}
                        readOnly
                      />
                    )}
                  </div>
                  <div className="col-md-1 col-sm-2 col-xs-2">
                    {isEditable(toleration) && (
                      <Tooltip content={t('modal~Remove')}>
                        <Button
                          type="button"
                          className="toleration-modal__delete-icon"
                          onClick={() => remove(i)}
                          aria-label={t('modal~Remove')}
                          variant="plain"
                        >
                          <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
        <Button className="pf-m-link--align-left" onClick={addRow} type="button" variant="link">
          <PlusCircleIcon data-test-id="pairs-list__add-icon" className="co-icon-space-r" />
          {t('modal~Add more')}
        </Button>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={false}
        submitText={t('modal~Save')}
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
