import * as _ from 'lodash';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  Button,
  Form,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  TextInput,
  Tooltip,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Td, Tbody } from '@patternfly/react-table';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { EmptyBox } from '../utils/status-box';
import { K8sKind, NodeKind, k8sPatch, Taint } from '../../module/k8s';
import { ModalComponentProps } from '@console/shared/src/types/modal';
import { usePromiseHandler } from '@console/shared/src/hooks/usePromiseHandler';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

const TaintsModal = (props: TaintsModalProps) => {
  const [taints, setTaints] = useState(props.resource.spec.taints || []);
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

  const { t } = useTranslation('public');

  const submit = (e: FormEvent<EventTarget>): void => {
    e.preventDefault();

    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = props.resource.spec.taints ? 'replace' : 'add';
    const patch = [{ path: '/spec/taints', op, value: taints }];

    handlePromise(k8sPatch(props.resourceKind, props.resource, patch))
      .then(() => props.close())
      .catch(() => {});
  };

  const cancel = () => {
    props.close();
  };

  const change = (e, i: number, field: string) => {
    // Handle both native events (from input) and values (from ConsoleSelect)
    const newValue = typeof e === 'string' ? e : e.target?.value ?? e;
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
    <>
      <ModalHeader
        title={t('Edit taints')}
        data-test-id="modal-title"
        labelId="taints-modal-title"
      />
      <ModalBody>
        <Form id="taints-form" onSubmit={submit}>
          {_.isEmpty(taints) ? (
            <EmptyBox label={t('Taints')} />
          ) : (
            <Table aria-label={t('Taints')} variant="compact" borders={false}>
              <Thead>
                <Tr>
                  <Th>{t('Key')}</Th>
                  <Th>{t('Value')}</Th>
                  <Th>{t('Effect')}</Th>
                </Tr>
              </Thead>

              <Tbody>
                {_.map(taints, (c, i: number) => (
                  <Tr key={i}>
                    <Td dataLabel={t('Key')}>
                      <TextInput
                        type="text"
                        value={c.key}
                        onChange={(_event, value) => change(value, i, 'key')}
                        isRequired
                        aria-label={t('Key')}
                      />
                    </Td>
                    <Td dataLabel={t('Value')}>
                      <TextInput
                        type="text"
                        value={c.value}
                        onChange={(_event, value) => change(value, i, 'value')}
                        aria-label={t('Value')}
                      />
                    </Td>
                    <Td dataLabel={t('Effect')}>
                      <ConsoleSelect
                        isFullWidth
                        items={effects}
                        onChange={(e) => change(e, i, 'effect')}
                        selectedKey={c.effect}
                        title={effects[c.effect]}
                        alwaysShowTitle
                      />
                    </Td>
                    <Td isActionCell>
                      <Tooltip content={t('Remove')}>
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
            icon={
              <PlusCircleIcon data-test-id="pairs-list__add-icon" className="co-icon-space-r" />
            }
            iconPosition="left"
            onClick={addRow}
            type="button"
            variant="link"
            isInline
          >
            {t('Add more')}
          </Button>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          isLoading={inProgress}
          form="taints-form"
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('Save')}
        </Button>
        <Button variant="link" onClick={cancel} type="button" data-test-id="modal-cancel-action">
          {t('Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export type TaintsModalProps = {
  resourceKind: K8sKind;
  resource: NodeKind;
} & ModalComponentProps;

const TaintsModalOverlay: OverlayComponent<TaintsModalProps> = (props) => {
  return (
    <Modal
      isOpen
      onClose={props.closeOverlay}
      variant={ModalVariant.small}
      aria-labelledby="taints-modal-title"
    >
      <TaintsModal {...props} close={props.closeOverlay} cancel={props.closeOverlay} />
    </Modal>
  );
};

export { TaintsModalOverlay };
