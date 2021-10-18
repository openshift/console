import i18next from 'i18next';
import * as _ from 'lodash';
import { Selector, k8sPatch, Patch } from '@console/internal/module/k8s';
import { PodDisruptionBudgetModel } from '../../models';
import { PodDisruptionBudgetKind } from './types';

export const intOrString = (val: string | number): string | number => {
  if (val === '') {
    return val;
  }
  if (typeof val === 'number') {
    return val;
  }
  const isValidInt = /^[0-9]*$/.test(val);

  return isValidInt ? parseInt(val, 10) : val;
};

export const pdbToK8sResource = (from: FormValues): PodDisruptionBudgetKind => {
  const requirement = from.requirement === 'Requirement' ? null : from.requirement;

  const res: PodDisruptionBudgetKind = {
    kind: PodDisruptionBudgetModel.kind,
    apiVersion: `${PodDisruptionBudgetModel.apiGroup}/${PodDisruptionBudgetModel.apiVersion}`,
    metadata: {
      name: from.name,
      namespace: from.namespace,
    },
    spec: {
      selector: {
        matchLabels: from.selector.matchLabels,
        matchExpressions: from.selector.matchExpressions,
      },
    },
  };
  const pdbRes = requirement
    ? _.merge(res, {
        spec: {
          [requirement]:
            from.minAvailable !== ''
              ? intOrString(from.minAvailable)
              : intOrString(from.maxUnavailable),
        },
      })
    : res;

  return pdbRes;
};

export const formValuesFromK8sResource = (from: PodDisruptionBudgetKind): FormValues => {
  return {
    name: from?.metadata?.name || '',
    namespace: from?.metadata?.namespace || '',
    minAvailable: from?.spec?.minAvailable ?? '',
    maxUnavailable: from?.spec?.maxUnavailable ?? '',
    selector:
      {
        matchLabels: from?.spec?.selector.matchLabels,
        matchExpressions: from?.spec?.selector.matchExpressions,
      } || {},

    requirement:
      _.isNil(from?.spec?.minAvailable) && _.isNil(from?.spec?.maxUnavailable)
        ? i18next.t('console-app~Requirement')
        : !_.isNil(from?.spec?.minAvailable)
        ? 'minAvailable'
        : 'maxUnavailable',
  };
};

export const patchPDB = (
  formValues: FormValues,
  existingResource: PodDisruptionBudgetKind,
): Promise<PodDisruptionBudgetKind> => {
  const patch: Patch[] = [];
  if (!_.isEmpty(formValues.selector.matchLabels)) {
    patch.push({
      op: 'add',
      path: '/spec/selector/matchLabels',
      value: formValues.selector.matchLabels,
    });
  }
  if (!_.isEmpty(formValues.selector.matchExpressions)) {
    patch.push({
      op: 'add',
      path: '/spec/selector/matchExpressions',
      value: formValues.selector.matchExpressions,
    });
  }
  if (!_.isNil(existingResource?.spec?.minAvailable) && formValues.minAvailable !== '') {
    patch.push({
      op: 'add',
      path: '/spec/minAvailable',
      value: intOrString(formValues.minAvailable),
    });
  }
  if (!_.isNil(existingResource?.spec?.maxUnavailable) && formValues.maxUnavailable !== '') {
    patch.push({
      op: 'add',
      path: '/spec/maxUnavailable',
      value: intOrString(formValues.maxUnavailable),
    });
  }
  if (!_.isNil(existingResource?.spec?.minAvailable) && formValues.maxUnavailable !== '') {
    patch.push(
      {
        op: 'remove',
        path: '/spec/minAvailable',
      },
      {
        op: 'add',
        path: '/spec/maxUnavailable',
        value: intOrString(formValues.maxUnavailable),
      },
    );
  }
  if (!_.isNil(existingResource?.spec?.maxUnavailable) && formValues.minAvailable !== '') {
    patch.push(
      {
        op: 'remove',
        path: '/spec/maxUnavailable',
      },
      {
        op: 'add',
        path: '/spec/minAvailable',
        value: intOrString(formValues.minAvailable),
      },
    );
  }

  return k8sPatch(PodDisruptionBudgetModel, existingResource, patch);
};
export type FormValues = {
  name: string;
  namespace: string;
  requirement?: string;
  minAvailable?: string | number;
  maxUnavailable?: string | number;
  selector?: Selector;
};
