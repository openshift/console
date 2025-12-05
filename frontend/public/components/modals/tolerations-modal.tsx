import * as _ from 'lodash-es';
import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { Button, Tooltip } from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Td, Tbody } from '@patternfly/react-table';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useTranslation } from 'react-i18next';

import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { EmptyBox } from '../utils/status-box';
import { K8sKind, k8sPatch, Toleration, TolerationOperator } from '../../module/k8s';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../factory';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

const TolerationsModal = (props: TolerationsModalProps) => {
  const getTolerationsFromResource = (): Toleration[] => {
    const { resource } = props;
    return props.resourceKind.kind === 'Pod'
      ? resource.spec.tolerations
      : resource.spec.template.spec.tolerations;
  };

  const [tolerations, setTolerations] = React.useState<Toleration[]>(
    getTolerationsFromResource() || [],
  );
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();

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

  const submit = (e: React.FormEvent<EventTarget>): void => {
    e.preventDefault();

    const path =
      props.resourceKind.kind === 'Pod' ? '/spec/tolerations' : '/spec/template/spec/tolerations';

    // Remove the internal `isNew` property
    const submittedTolerations = _.map(tolerations, (toleration) => _.omit(toleration, 'isNew'));

    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = _.isEmpty(getTolerationsFromResource()) ? 'replace' : 'add';

    const patch = [{ path, op, value: submittedTolerations }];

    handlePromise(k8sPatch(props.resourceKind, props.resource, patch))
      .then(() => props.close())
      .catch(() => {});
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
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>{t('public~Edit tolerations')}</ModalTitle>
      <ModalBody>
        {_.isEmpty(tolerations) ? (
          <EmptyBox label={t('public~Tolerations')} />
        ) : (
          <Table
            aria-label={t('public~Tolerations')}
            variant="compact"
            borders={false}
            className="co-modal-table"
          >
            <Thead>
              <Tr>
                <Th>{t('public~Key')}</Th>
                <Th>{t('public~Operator')}</Th>
                <Th>{t('public~Value')}</Th>
                <Th>{t('public~Effect')}</Th>
              </Tr>
            </Thead>

            <Tbody>
              {_.map(tolerations, (toleration, i) => {
                const { key, operator, value, effect = '' } = toleration;
                const keyReadOnly = !isEditable(toleration);
                const valueReadOnly = !isEditable(toleration) || operator === 'Exists';
                return (
                  <Tr key={i}>
                    <Td dataLabel={t('public~Key')}>
                      <span
                        className={css('pf-v6-c-form-control', {
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
                    </Td>
                    <Td dataLabel={t('public~Operator')}>
                      {isEditable(toleration) ? (
                        <ConsoleSelect
                          isFullWidth
                          items={operators}
                          onChange={(op: TolerationOperator) => opChange(op, i)}
                          selectedKey={operator}
                          title={operators[operator]}
                          alwaysShowTitle
                        />
                      ) : (
                        <span className="pf-v6-c-form-control pf-m-readonly">
                          <input type="text" value={operator} readOnly />
                        </span>
                      )}
                    </Td>
                    <Td dataLabel={t('public~Value')}>
                      <span
                        className={css('pf-v6-c-form-control', {
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
                    </Td>
                    <Td dataLabel={t('public~Effect')}>
                      {isEditable(toleration) ? (
                        <ConsoleSelect
                          isFullWidth
                          items={effects}
                          onChange={(e: string) => change(e, i, 'effect')}
                          selectedKey={effect}
                          title={effects[effect]}
                          alwaysShowTitle
                        />
                      ) : (
                        <span className="pf-v6-c-form-control pf-m-readonly">
                          <input type="text" value={effects[effect]} readOnly />
                        </span>
                      )}
                    </Td>
                    <Td isActionCell>
                      {isEditable(toleration) && (
                        <Tooltip content={t('public~Remove')}>
                          <Button
                            icon={
                              <MinusCircleIcon className="pairs-list__side-btn pairs-list__delete-icon" />
                            }
                            type="button"
                            onClick={() => remove(i)}
                            aria-label={t('public~Remove')}
                            variant="plain"
                          />
                        </Tooltip>
                      )}
                    </Td>
                  </Tr>
                );
              })}
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
          {t('public~Add more')}
        </Button>
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
} & ModalComponentProps;
