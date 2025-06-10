import * as _ from 'lodash-es';
import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Td, Tbody } from '@patternfly/react-table';
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

  const { t } = useTranslation('public');

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
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{t('Edit taints')}</ModalTitle>
      <ModalBody>
        {_.isEmpty(taints) ? (
          <EmptyBox label={t('Taints')} />
        ) : (
          <Table
            aria-label={t('Taints')}
            variant="compact"
            borders={false}
            className="co-modal-table"
          >
            <Thead>
              <Tr>
                <Th>{t('Key')}</Th>
                <Th>{t('Value')}</Th>
                <Th>{t('Effect')}</Th>
              </Tr>
            </Thead>

            <Tbody>
              {_.map(taints, (c, i) => (
                <Tr key={i}>
                  <Td dataLabel={t('Key')}>
                    <span className="pf-v6-c-form-control">
                      <input
                        type="text"
                        value={c.key}
                        onChange={(e) => change(e, i, 'key')}
                        required
                      />
                    </span>
                  </Td>
                  <Td dataLabel={t('Value')}>
                    <span className="pf-v6-c-form-control">
                      <input type="text" value={c.value} onChange={(e) => change(e, i, 'value')} />
                    </span>
                  </Td>
                  <Td dataLabel={t('Effect')}>
                    <Dropdown
                      dropDownClassName="dropdown--full-width"
                      items={effects}
                      onChange={(e) => change(e, i, 'effect')}
                      selectedKey={c.effect}
                      title={effects[c.effect]}
                    />
                  </Td>
                  <Td isActionCell>
                    <Tooltip content="Remove">
                      <Button
                        icon={
                          <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
                        }
                        className="pf-v6-u-mt-md pf-v6-u-mt-0-on-md"
                        type="button"
                        onClick={() => remove(i)}
                        aria-label={t('Remove')}
                        variant="plain"
                      />
                    </Tooltip>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        <Button
          icon={<PlusCircleIcon data-test-id="pairs-list__add-icon" className="co-icon-space-r" />}
          className="pf-v6-u-mt-md"
          iconPosition="left"
          onClick={addRow}
          type="button"
          variant="link"
        >
          {t('Add more')}
        </Button>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={false}
        submitText={t('Save')}
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
