import * as _ from 'lodash-es';
import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
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

  const { errorMessage } = props;

  return (
    <form onSubmit={submit} name="form" className="modal-content taint-modal">
      <ModalTitle>{t('public~Edit taints')}</ModalTitle>
      <ModalBody>
        {_.isEmpty(taints) ? (
          <EmptyBox label={t('public~Taints')} />
        ) : (
          <>
            <div className="row taint-modal__heading hidden-sm hidden-xs">
              <div className="col-sm-4 text-secondary text-uppercase">{t('public~Key')}</div>
              <div className="col-sm-3 text-secondary text-uppercase">{t('public~Value')}</div>
              <div className="col-sm-4 text-secondary text-uppercase">{t('public~Effect')}</div>
              <div className="col-sm-1 co-empty__header" />
            </div>
            {_.map(taints, (c, i) => (
              <div className="row taint-modal__row" key={i}>
                <div className="col-md-4 col-xs-5 taint-modal__field">
                  <div className="taint-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                    {t('public~Key')}
                  </div>
                  <span className="pf-v6-c-form-control">
                    <input
                      type="text"
                      className="taint-modal__input"
                      value={c.key}
                      onChange={(e) => change(e, i, 'key')}
                      required
                    />
                  </span>
                </div>
                <div className="col-md-3 col-xs-5 taint-modal__field">
                  <div className="taint-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                    {t('public~Value')}
                  </div>
                  <span className="pf-v6-c-form-control">
                    <input type="text" value={c.value} onChange={(e) => change(e, i, 'value')} />
                  </span>
                </div>
                <div className="clearfix visible-sm visible-xs" />
                <div className="col-md-4 col-xs-5 taint-modal__field">
                  <div className="taint-modal__heading hidden-md hidden-lg text-secondary text-uppercase">
                    {t('public~Effect')}
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
                      icon={
                        <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
                      }
                      type="button"
                      className="taint-modal__delete-icon"
                      onClick={() => remove(i)}
                      aria-label={t('public~Remove')}
                      variant="plain"
                    />
                  </Tooltip>
                </div>
              </div>
            ))}
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

export const taintsModal = createModalLauncher(TaintsModal);

export type TaintsModalProps = {
  resourceKind: K8sKind;
  resource: NodeKind;
  close: () => void;
  handlePromise: <T>(promise: Promise<T>) => Promise<T>;
} & ModalComponentProps &
  HandlePromiseProps;
