import type { FC } from 'react';
import * as _ from 'lodash';
import type { K8sResourceCondition, K8sResourceKind } from '@console/internal/module/k8s';
import { Status } from '@console/shared/src/components/status/Status';
import { SuccessStatus } from '@console/shared/src/components/status/statuses';
import { DASH } from '@console/shared/src/constants/ui';
import { getNamespace } from '@console/shared/src/selectors/common';

type OperandStatusType = {
  type: string;
  value: string;
};

export type OperandStatusProps = {
  operand: K8sResourceKind;
};

/**
 * Operands have no common status field, so fall back through the shapes CRDs tend to use:
 * `status.phase`, `status.status`, `status.state`, then any conditions reporting True.
 */
const getOperandStatus = (obj: K8sResourceKind): OperandStatusType => {
  const { phase, status, state, conditions } = obj?.status || {};

  if (phase && _.isString(phase)) {
    return {
      type: 'Phase',
      value: phase,
    };
  }

  if (status && _.isString(status)) {
    return {
      type: 'Status',
      value: status,
    };
  }

  if (state && _.isString(state)) {
    return {
      type: 'State',
      value: state,
    };
  }

  const conditionsIsSingleObject =
    typeof conditions === 'object' && !Array.isArray(conditions) && conditions !== null;
  const conditionList = Array.isArray(conditions)
    ? conditions
    : conditionsIsSingleObject
      ? [conditions]
      : [];

  const trueConditions = conditionList.filter(
    (c: K8sResourceCondition | null) => c && c.status === 'True',
  );
  if (trueConditions?.length) {
    const types = trueConditions.map((c: K8sResourceCondition) => c.type);
    return {
      type: types.length === 1 ? 'Condition' : 'Conditions',
      value: types.join(', '),
    };
  }

  return null;
};

export const OperandStatus: FC<OperandStatusProps> = ({ operand }) => {
  const status: OperandStatusType = getOperandStatus(operand);
  if (!status) {
    return <>{DASH}</>;
  }

  const { type, value } = status;
  return (
    <span className="co-icon-and-text">
      {type}
      <span className="pf-v6-u-pr-sm">:</span>{' '}
      {value === 'Running' ? <SuccessStatus title={value} /> : <Status status={value} />}
    </span>
  );
};

/** The sortable form of what `OperandStatus` renders. */
export const getOperandStatusText = (operand: K8sResourceKind): string => {
  const status = getOperandStatus(operand);
  return status ? `${status.type}: ${status.value}` : '';
};

export const getOperandNamespace = (obj: K8sResourceKind): string | null => getNamespace(obj);
