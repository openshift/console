import { useCallback, useMemo } from 'react';
import { ButtonVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Action, K8sVerb } from '@console/dynamic-plugin-sdk';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useDeepCompareMemoize } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useDeepCompareMemoize';
import * as UIActions from '@console/internal/actions/ui';
import { asAccessReview, resourceObjPath } from '@console/internal/components/utils';
import {
  RoleBindingKind,
  ClusterRoleBindingKind,
  referenceFor,
} from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { BindingActionCreator, CommonActionCreator } from './types';
import { useCommonActions } from './useCommonActions';

/**
 * A React hook for retrieving actions related to a Binding resource.
 *
 * @param {BindingKind} obj - The specific RoleBinding or ClusterRoleBinding resource instance for which to generate actions.
 * @param {BindingActionCreator[]} [filterActions] - Optional. If provided, the returned `actions` array will contain
 * only the specified actions. If omitted, it will contain all Binding actions. In case of invalid `actionCreators`
 * returned `actions` are an empty array.
 *
 * This hook is robust to inline arrays/objects for the `filterActions` argument, so you do not need to memoize or define
 * the array outside your component. The actions will only update if the actual contents of `filterActions` change, not just the reference.
 * @returns An array containing the generated action(s).
 */
export const useBindingActions = (
  obj: RoleBindingKind | ClusterRoleBindingKind,
  filterActions?: BindingActionCreator[],
): Action[] => {
  const { t } = useTranslation();
  const [model] = useK8sModel(referenceFor(obj));
  const dispatch = useDispatch();
  const startImpersonate = useCallback(
    (kind, name) => dispatch(UIActions.startImpersonate(kind, name)),
    [dispatch],
  );
  const navigate = useNavigate();
  const commonActions = useCommonActions(model, obj, [CommonActionCreator.Delete] as const);

  const { subjectIndex, subjects } = obj;
  const subject = subjects?.[subjectIndex];
  const deleteBindingSubject = useWarningModal({
    title: t('public~Delete {{label}} subject?', {
      label: model.kind,
    }),
    children: t('public~Are you sure you want to delete subject {{name}} of type {{kind}}?', {
      name: subject.name,
      kind: subject.kind,
    }),
    confirmButtonVariant: ButtonVariant.danger,
    confirmButtonLabel: t('public~Delete'),
    cancelButtonLabel: t('public~Cancel'),
    onConfirm: () => {
      return k8sPatchResource({
        model,
        resource: obj,
        data: [
          {
            op: 'remove',
            path: `/subjects/${subjectIndex}`,
          },
        ],
      });
    },
    ouiaId: 'WebTerminalCloseConfirmation',
  });

  const memoizedFilterActions = useDeepCompareMemoize(filterActions);

  const factory = useMemo(
    () => ({
      [BindingActionCreator.ImpersonateBindingSubject]: () => ({
        id: 'impersonate-binding',
        label: t('public~Impersonate {{kind}} "{{name}}"', {
          kind: subject.kind,
          name: subject.name,
        }),
        cta: () => {
          startImpersonate(subject.kind, subject.name);
          navigate(window.SERVER_FLAGS.basePath);
        },
        // Must use API group authorization.k8s.io, NOT user.openshift.io
        // See https://kubernetes.io/docs/reference/access-authn-authz/authentication/#user-impersonation
        accessReview: {
          group: 'authorization.k8s.io',
          resource: subject.kind === 'Group' ? 'groups' : 'users',
          name: subject.name,
          verb: 'impersonate' as K8sVerb,
        },
      }),
      [BindingActionCreator.DuplicateBinding]: () => ({
        id: 'duplicate-binding',
        label: t('public~Duplicate {{kindLabel}}', {
          kindLabel: model.kind,
        }),
        cta: {
          href: `${decodeURIComponent(
            resourceObjPath(obj, model.kind),
          )}/copy?subjectIndex=${subjectIndex}`,
        },
        // Only perform access checks when duplicating cluster role bindings.
        // It's not practical to check namespace role bindings since we don't know what namespace the user will pick in the form.
        accessReview: obj.metadata?.namespace ? null : asAccessReview(model, obj, 'create'),
      }),
      [BindingActionCreator.EditBindingSubject]: () => ({
        id: 'edit-binding-subject',
        label: t('public~Edit {{kindLabel}} subject', {
          kindLabel: model.kind,
        }),
        cta: {
          href: `${decodeURIComponent(
            resourceObjPath(obj, model.kind),
          )}/edit?subjectIndex=${subjectIndex}`,
        },
        accessReview: asAccessReview(model, obj, 'update'),
      }),
      [BindingActionCreator.DeleteBindingSubject]: () => ({
        id: 'delete-binding-subject',
        label: t('public~Delete {{label}} subject', {
          label: model.kind,
        }),
        cta: () => deleteBindingSubject(),
        accessReview: asAccessReview(model, obj, 'patch'),
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, navigate, obj, startImpersonate, subject.kind, subject.name, subjectIndex, t],
  );

  // filter and initialize requested actions or construct list of all BindingActions
  const actions = useMemo<Action[]>(() => {
    if (memoizedFilterActions) {
      return memoizedFilterActions.map((creator) => factory[creator]());
    }
    return [
      ...(subject.kind === 'User' || subject.kind === 'Group'
        ? [factory.ImpersonateBindingSubject()]
        : []),
      factory.DuplicateBinding(),
      factory.EditBindingSubject(),
      ...(subjects.length === 1 ? [commonActions.Delete] : [factory.DeleteBindingSubject()]),
    ];
  }, [memoizedFilterActions, subject.kind, factory, subjects.length, commonActions.Delete]);

  return actions;
};
