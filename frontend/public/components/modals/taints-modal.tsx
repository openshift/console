import * as _ from 'lodash-es';
import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import { Dropdown, EmptyBox, withHandlePromise, HandlePromiseProps } from '../utils';
import { K8sKind, k8sPatch, NodeKind, Taint } from '../../module/k8s';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory';

const TaintsModal = withHandlePromise((props: TaintsModalProps) => {
  const [taints, setTaints] = React.useState(props.resource.spec.taints || []);
  const [errorMessage] = React.useState<string>();

  const { t } = useTranslation();

  const submit = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();

    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = props.resource.spec.taints ? 'replace' : 'add';
    const patch = [{ path: '/spec/taints', op, value: taints }];

    props.handlePromise(k8sPatch(props.resourceKind, props.resource, patch), props.close);
  };

  const cancel = () => {
    props.close();
  };

  const change = (e, i: number, field: string) => {
    const newValue = e.target ? e.target.value : e;
    setTaints((prevTaints) => {
      const clonedTaints = _.cloneDeep(prevTaints);
      clonedTaints[i][field] = newValue;
      return clonedTaints;
    });
  };

  const remove = (i: number) => {
    const tmpTaints = [...taints];
    tmpTaints.splice(i, 1);
    setTaints(tmpTaints);
  };

  const newTaint = (): Taint => {
    return { key: '', value: '', effect: 'NoSchedule' };
  };

  const addRow = () => {
    setTaints([...taints, newTaint()]);
  };

  const effects = {
    NoSchedule: 'NoSchedule',
    PreferNoSchedule: 'PreferNoSchedule',
    NoExecute: 'NoExecute',
  };

  return (
    <form
      onSubmit={submit}
      name="form"
      className="modal-content modal-content--accommodate-dropdown taint-modal"
    >
      <ModalTitle>{t('modal~Edit taints')}</ModalTitle>
      <ModalBody>
        {_.isEmpty(taints) ? (
          <EmptyBox label={t('modal~Taints')} />
        ) : (
          <>
            <div className="row taint-modal__heading hidden-sm hidden-xs">
              <div className="col-sm-4 text-secondary text-uppercase">{t('modal~Key')}</div>
              <div className="col-sm-3 text-secondary text-uppercase">{t('modal~Value')}</div>
              <div className="col-sm-4 text-secondary text-uppercase">{t('modal~Effect')}</div>
              <div className="col-sm-1 co-empty__header" />
            </div>
            {_.map(taints, (c, i) => (
              <div className="row taint-modal__row" key={i}>
                <div className="col-md-4 col-xs-5 taint-modal__field">
                  <div className="taint-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                    {t('modal~Key')}
                  </div>
                  <input
                    type="text"
                    className="pf-c-form-control taint-modal__input"
                    value={c.key}
                    onChange={(e) => change(e, i, 'key')}
                    required
                  />
                </div>
                <div className="col-md-3 col-xs-5 taint-modal__field">
                  <div className="taint-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                    {t('modal~Value')}
                  </div>
                  <input
                    type="text"
                    className="pf-c-form-control taint-modal__input"
                    value={c.value}
                    onChange={(e) => change(e, i, 'value')}
                  />
                </div>
                <div className="clearfix visible-sm visible-xs" />
                <div className="col-md-4 col-xs-5 taint-modal__field">
                  <div className="taint-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                    {t('modal~Effect')}
                  </div>
                  <Dropdown
                    className="taint-modal__dropdown"
                    dropDownClassName="dropdown--full-width"
                    items={effects}
                    onChange={(e) => change(e, i, 'effect')}
                    selectedKey={c.effect}
                    title={effects[c.effect]}
                  />
                </div>
                <div className="col-md-1 col-md-offset-0 col-sm-offset-10 col-xs-offset-10">
                  <Tooltip content="Remove">
                    <Button
                      type="button"
                      className="taint-modal__delete-icon"
                      onClick={() => remove(i)}
                      aria-label={t('modal~Remove')}
                      variant="plain"
                    >
                      <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            ))}
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

export const taintsModal = createModalLauncher(TaintsModal);

export type TaintsModalProps = {
  resourceKind: K8sKind;
  resource: NodeKind;
  close: () => void;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
} & ModalComponentProps &
  HandlePromiseProps;
