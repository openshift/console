import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { Checkbox } from '@console/internal/components/checkbox';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import {
  history,
  ResourceLink,
  resourceListPathFromModel,
  StatusBox,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { ConsoleOperatorConfigModel } from '@console/internal/models';
import {
  K8sKind,
  K8sResourceCommon,
  K8sResourceKind,
  modelFor,
  referenceFor,
  k8sPatch,
  referenceForModel,
} from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { CONSOLE_OPERATOR_CONFIG_NAME } from '@console/shared/src/constants';
import {
  usePromiseHandler,
  usePromisesAllSettledHandler,
} from '@console/shared/src/hooks/promise-handler';
import { useOperands } from '@console/shared/src/hooks/useOperands';
import { getPluginPatch, isPluginEnabled } from '@console/shared/src/utils';
import { GLOBAL_OPERATOR_NAMESPACE, OPERATOR_UNINSTALL_MESSAGE_ANNOTATION } from '../../const';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../models';
import { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import { getClusterServiceVersionPlugins } from '../../utils';
import { OperandLink } from '../operand/operand-link';

const anyOperandDeletionErrors = (operandDeletionErrors: OperandWithErrorProps[]): boolean =>
  operandDeletionErrors.length > 0;

export const UninstallOperatorModal: React.FC<UninstallOperatorModalProps> = ({
  cancel,
  close,
  csv,
  k8sKill,
  subscription,
}) => {
  const { t } = useTranslation();
  const [
    handleOperatorUninstallPromise,
    operatorUninstallInProgress,
    operatorUninstallErrorMessage,
  ] = usePromiseHandler();
  const [operatorUninstallFinished, setOperatorUninstallFinished] = React.useState(false);
  const [isDeleteAllOperandsSelected, setIsDeleteAllOperandsSelected] = React.useState(false);
  const [handleOperandsDeletePromise, operandsDeleteInProgress] = usePromisesAllSettledHandler();
  const [operandsDeleteFinished, setOperandsDeleteFinished] = React.useState(false);
  const [operandDeletionErrors, setOperandDeletionErrors] = React.useState<OperandWithErrorProps[]>(
    [],
  );

  const canPatchConsoleOperatorConfig = useAccessReview({
    group: ConsoleOperatorConfigModel.apiGroup,
    resource: ConsoleOperatorConfigModel.plural,
    verb: 'patch',
    name: CONSOLE_OPERATOR_CONFIG_NAME,
  });

  const csvPlugins = getClusterServiceVersionPlugins(csv?.metadata?.annotations);

  const [consoleOperatorConfig] = useK8sWatchResource<K8sResourceKind>(
    canPatchConsoleOperatorConfig && csvPlugins.length > 0
      ? {
          kind: referenceForModel(ConsoleOperatorConfigModel),
          isList: false,
          name: CONSOLE_OPERATOR_CONFIG_NAME,
        }
      : null,
  );

  const enabledPlugins = csvPlugins.filter((plugin) =>
    isPluginEnabled(consoleOperatorConfig, plugin),
  );

  const removePlugins: boolean =
    !!consoleOperatorConfig && canPatchConsoleOperatorConfig && enabledPlugins.length > 0;

  const subscriptionName = subscription?.spec?.name;
  const subscriptionNamespace = subscription?.metadata?.namespace;

  const isSubmitInProgress = React.useMemo(
    () => operatorUninstallInProgress || operandsDeleteInProgress,
    [operatorUninstallInProgress, operandsDeleteInProgress],
  );

  const isSubmitFinished = React.useMemo(
    () =>
      !isSubmitInProgress &&
      (isDeleteAllOperandsSelected ? operandsDeleteFinished : true) &&
      operatorUninstallFinished,
    [
      isSubmitInProgress,
      isDeleteAllOperandsSelected,
      operandsDeleteFinished,
      operatorUninstallFinished,
    ],
  );

  const anySubmitErrors = React.useMemo(
    () =>
      anyOperandDeletionErrors(operandDeletionErrors) || operatorUninstallErrorMessage.length > 0,
    [operandDeletionErrors, operatorUninstallErrorMessage],
  );

  const [operands, operandsLoaded, operandsLoadedErrorMessage] = useOperands(
    subscriptionName,
    subscriptionNamespace,
  );

  const closeAndRedirect = React.useCallback(() => {
    close();
    // if url contains subscription name (ex: "codeready-workspaces") or installedCSV version (ex: "crwoperator.v2.9.0")
    // redirect to ClusterServiceVersion "Installed Operators" list page,
    // else uninstalled from "Installed Operators" list page, so do not redirect
    if (
      window.location.pathname.split('/').includes(subscription.metadata.name) ||
      window.location.pathname.split('/').includes(subscription?.status?.installedCSV)
    ) {
      history.push(resourceListPathFromModel(ClusterServiceVersionModel, getActiveNamespace()));
    }
  }, [close, subscription]);

  React.useEffect(() => {
    if (isSubmitFinished && !anySubmitErrors) {
      closeAndRedirect();
    }
  }, [closeAndRedirect, anySubmitErrors, isSubmitFinished]);

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (isSubmitFinished) {
      closeAndRedirect();
      return;
    }
    const deleteOptions = {
      kind: 'DeleteOptions',
      apiVersion: 'v1',
      propagationPolicy: 'Foreground',
    };

    const patch = removePlugins
      ? enabledPlugins.map((plugin) => getPluginPatch(consoleOperatorConfig, plugin, false))
      : null;

    const operatorUninstallPromises = [
      k8sKill(SubscriptionModel, subscription, {}, deleteOptions),
      ...(subscription?.status?.installedCSV
        ? [
            k8sKill(
              ClusterServiceVersionModel,
              {
                metadata: {
                  name: subscription.status.installedCSV,
                  namespace: subscription.metadata.namespace,
                },
              },
              {},
              deleteOptions,
            ),
          ]
        : []),
      ...(removePlugins
        ? [k8sPatch(ConsoleOperatorConfigModel, consoleOperatorConfig, patch)]
        : []),
    ];
    const operandDeletionPromises = isDeleteAllOperandsSelected
      ? operands.map((operand: K8sResourceCommon) => {
          const model = modelFor(referenceFor(operand));
          return k8sKill(model, operand, {}, deleteOptions);
        })
      : [];
    if (operandDeletionPromises.length > 0) {
      // The promise returned by Promise.allSettled() never rejects; no need for catch-or-return.
      // eslint-disable-next-line promise/catch-or-return
      handleOperandsDeletePromise(operandDeletionPromises).then(
        (results: PromiseSettledResult<any>[]) => {
          const operandsWithErrors: OperandWithErrorProps[] = results.reduce((acc, curr, i) => {
            return curr.status === 'rejected'
              ? acc.concat({ operand: operands[i], errorMessage: curr.reason })
              : acc;
          }, [] as OperandWithErrorProps[]);
          setOperandDeletionErrors(operandsWithErrors);
          setOperandsDeleteFinished(true);
        },
      );
    }
    setOperandsDeleteFinished(!isDeleteAllOperandsSelected);

    handleOperatorUninstallPromise(Promise.all(operatorUninstallPromises))
      .then(() => {
        setOperatorUninstallFinished(true);
      })
      .catch(() => {
        setOperatorUninstallFinished(true);
      });
  };

  const name = csv?.spec?.displayName || subscription?.spec?.name;
  const csvName = csv?.metadata?.name;
  const namespace =
    subscription.metadata.namespace === GLOBAL_OPERATOR_NAMESPACE
      ? 'all-namespaces'
      : subscription.metadata.namespace;
  const uninstallMessage = csv?.metadata?.annotations?.[OPERATOR_UNINSTALL_MESSAGE_ANNOTATION];
  return (
    <form onSubmit={submit} name="form" className="modal-content co-catalog-install-modal">
      <ModalTitle className="modal-header">
        <YellowExclamationTriangleIcon className="co-icon-space-r" /> {t('olm~Uninstall Operator?')}
      </ModalTitle>
      <ModalBody>
        {!isSubmitFinished ? (
          <>
            <Instructions
              name={name}
              namespace={namespace}
              removePlugins={removePlugins}
              enabledPlugins={enabledPlugins}
              uninstallMessage={uninstallMessage}
            />
            <OperandsSection
              operands={operands}
              operandsLoaded={operandsLoaded}
              operandsLoadedErrorMessage={operandsLoadedErrorMessage}
              csvName={csvName}
              cancel={cancel}
              isDeleteAllOperandsSelected={isDeleteAllOperandsSelected}
              setIsDeleteAllOperandsSelected={setIsDeleteAllOperandsSelected}
            />
          </>
        ) : (
          <SubmitResults
            operatorUninstallErrorMessage={operatorUninstallErrorMessage}
            name={name}
            namespace={namespace}
            isDeleteAllOperandsSelected={isDeleteAllOperandsSelected}
            operandDeletionErrors={operandDeletionErrors}
            csvName={csvName}
            cancel={cancel}
          />
        )}
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitInProgress}
        cancel={cancel}
        submitDanger={!isSubmitFinished} // if submit finished show a non-danger 'OK'
        submitText={t(isSubmitFinished ? 'olm~OK' : 'olm~Uninstall')}
      />
    </form>
  );
};

const Instructions: React.FC<InstructionProps> = ({
  name,
  namespace,
  removePlugins,
  enabledPlugins,
  uninstallMessage,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <p>
        <Trans t={t} ns="olm">
          Operator <strong>{{ name }}</strong> will be removed from <strong>{{ namespace }}</strong>
          . Click on the checkbox below to also remove all Operands associated with this Operator.
          If your Operator configured off-cluster resources, these will continue to run and require
          manual cleanup.
        </Trans>
      </p>
      {removePlugins && (
        <p>
          {t('olm~The console plugin provided by this operator will be disabled and removed.', {
            count: enabledPlugins.length,
          })}
        </p>
      )}
      {uninstallMessage && (
        <>
          <h2>{t('olm~Message from Operator developer')}</h2>
          <p>{uninstallMessage}</p>
        </>
      )}
    </>
  );
};

const OperandsSection: React.FC<OperandsSectionProps> = ({
  operandsLoaded,
  operands,
  operandsLoadedErrorMessage,
  csvName,
  cancel,
  isDeleteAllOperandsSelected,
  setIsDeleteAllOperandsSelected,
}) => {
  const { t } = useTranslation();
  return operandsLoadedErrorMessage ? (
    <OperandsLoadAlert operandsLoadedErrorMessage={operandsLoadedErrorMessage} />
  ) : (
    (!operandsLoaded || (operandsLoaded && operands.length > 0)) && (
      <span className="co-operator-uninstall__operands-section">
        <h2>{t('olm~Operand instances')}</h2>
        <OperandsTable
          operands={operands}
          loaded={operandsLoaded}
          csvName={csvName}
          cancel={cancel} // for breadcrumbs & cancel modal when clicking on operand links
        />
        <Checkbox
          onChange={({ currentTarget }) => setIsDeleteAllOperandsSelected(currentTarget.checked)}
          name="delete-all-operands"
          label={t('olm~Delete all operand instances for this operator')}
          checked={isDeleteAllOperandsSelected}
        />
      </span>
    )
  );
};

const OperandsLoadAlert: React.FC<{ operandsLoadedErrorMessage: string }> = ({
  operandsLoadedErrorMessage,
}) => {
  const { t } = useTranslation();
  return (
    <Alert variant="warning" className="co-alert" title={t('olm~Cannot load Operands')} isInline>
      <p>
        {t(
          'olm~There was an error loading operands for this operator. Operands will need to be deleted manually.',
        )}
        <br />
        {operandsLoadedErrorMessage}
      </p>
    </Alert>
  );
};

const OperatorUninstallSuccess: React.FC<{ name: string; namespace: string }> = ({
  name,
  namespace,
}) => {
  const { t } = useTranslation();
  return (
    <Alert
      variant="success"
      className="co-alert"
      title={t('olm~Successfully Uninstalled Operator')}
      isInline
    >
      <p>
        <Trans t={t} ns="olm">
          Operator <strong>{{ name }}</strong> successfully uninstalled from{' '}
          <strong>{{ namespace }}</strong>.
        </Trans>
      </p>
    </Alert>
  );
};

const OperatorUninstallError: React.FC<{ errorMessage: string }> = ({ errorMessage }) => {
  const { t } = useTranslation();
  return (
    <Alert
      variant="danger"
      className="co-alert"
      title={t('olm~Error Uninstalling Operator')}
      isInline
    >
      <p>
        {t('olm~There was an error uninstalling the operator.')}
        <br />
        {errorMessage}
      </p>
    </Alert>
  );
};

const OperandDeletionErrors: React.FC<{
  operandDeletionErrors: OperandWithErrorProps[];
  csvName: string;
  cancel?: () => void;
}> = ({ operandDeletionErrors, csvName, cancel }) => {
  const { t } = useTranslation();
  return (
    <Alert variant="danger" className="co-alert" title={t('olm~Error Deleting Operands')} isInline>
      <p>
        <Trans t={t} ns="olm">
          There were errors deleting the following Operands, they will need to be deleted manually:
        </Trans>
      </p>
      <OperandErrors
        operandsWithErrors={operandDeletionErrors}
        csvName={csvName}
        cancel={cancel} // for breadcrumbs & cancel modal when clicking on operand links
      />
    </Alert>
  );
};

const OperandDeletionSuccess: React.FC<{ name: string; namespace: string }> = ({
  name,
  namespace,
}) => {
  const { t } = useTranslation();
  return (
    <Alert
      variant="success"
      className="co-alert"
      title={t('olm~Successfully deleted all Operand Instances')}
      isInline
    >
      <p>
        <Trans t={t} ns="olm">
          All Operand instances for Operator <strong>{{ name }}</strong> in{' '}
          <strong>{{ namespace }}</strong> have been deleted.
        </Trans>
      </p>
    </Alert>
  );
};

const UninstallAlert: React.FC<{ errorMessage: string; name: string; namespace: string }> = ({
  errorMessage,
  name,
  namespace,
}) =>
  errorMessage ? (
    <OperatorUninstallError errorMessage={errorMessage} />
  ) : (
    <OperatorUninstallSuccess name={name} namespace={namespace} />
  );

const OperandDeletionAlert: React.FC<{
  errors: OperandWithErrorProps[];
  csvName: string;
  cancel: () => void;
  name: string;
  namespace: string;
}> = ({ errors, csvName, cancel, name, namespace }) =>
  errors.length ? (
    <OperandDeletionErrors operandDeletionErrors={errors} csvName={csvName} cancel={cancel} />
  ) : (
    <OperandDeletionSuccess name={name} namespace={namespace} />
  );

const SubmitResults: React.FC<SubmitResultsProps> = ({
  operatorUninstallErrorMessage,
  name,
  namespace,
  isDeleteAllOperandsSelected,
  operandDeletionErrors,
  csvName,
  cancel,
}) => (
  <>
    <UninstallAlert
      errorMessage={operatorUninstallErrorMessage}
      name={name}
      namespace={namespace}
    />
    {isDeleteAllOperandsSelected && (
      <OperandDeletionAlert
        csvName={csvName}
        errors={operandDeletionErrors}
        cancel={cancel}
        name={name}
        namespace={namespace}
      />
    )}
  </>
);

export const OperandsTable: React.FC<OperandsTableProps> = ({
  operands,
  loaded,
  csvName,
  cancel,
}) => {
  const { t } = useTranslation();
  return (
    <StatusBox
      skeleton={<div className="loading-skeleton--table" />}
      data={operands}
      loaded={loaded}
    >
      <table className="pf-c-table pf-m-compact pf-m-border-rows">
        <thead>
          <tr>
            <th>{t('olm~Name')}</th>
            <th>{t('olm~Kind')}</th>
            <th>{t('olm~Namespace')}</th>
          </tr>
        </thead>
        <tbody>
          {_.map(operands, (operand, i) => (
            <>
              <tr key={i}>
                <td>
                  <OperandLink obj={operand} csvName={csvName} cancel={cancel} />
                </td>
                <td className="co-break-word" data-test-operand-kind={operand.kind}>
                  {operand.kind}
                </td>
                <td>
                  {operand.metadata.namespace ? (
                    <ResourceLink
                      kind="Namespace"
                      title={operand.metadata.namespace}
                      name={operand.metadata.namespace}
                      onClick={cancel}
                    />
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </StatusBox>
  );
};

export const OperandErrors: React.FC<OperandErrorsProps> = ({
  operandsWithErrors,
  csvName,
  cancel,
}) => {
  const { t } = useTranslation();
  return (
    <ul className="co-operator-uninstall-alert__list">
      {_.map(operandsWithErrors, (operandWithError, i) => (
        <li key={i} className="list-unstyled co-operator-uninstall-alert__list-item">
          <OperandLink obj={operandWithError.operand} csvName={csvName} cancel={cancel} inline />{' '}
          {`(${operandWithError.operand.kind})`}
          {'  '}
          {t('olm~Error: {{error}}', {
            error: `${operandWithError.errorMessage}`,
          })}
        </li>
      ))}
    </ul>
  );
};

export const createUninstallOperatorModal = createModalLauncher(UninstallOperatorModal);

export type UninstallOperatorModalProps = {
  cancel?: () => void;
  close?: () => void;
  k8sKill: (kind: K8sKind, resource: K8sResourceKind, options: any, json: any) => Promise<any>;
  k8sGet: (kind: K8sKind, name: string, namespace: string) => Promise<K8sResourceKind>;
  k8sPatch: (
    kind: K8sKind,
    resource: K8sResourceKind,
    data: { op: string; path: string; value: any }[],
  ) => Promise<any>;
  subscription: SubscriptionKind;
  csv?: ClusterServiceVersionKind;
};

export type InstructionProps = {
  name: string;
  namespace: string;
  removePlugins: boolean;
  enabledPlugins: string[];
  uninstallMessage: string;
};

export type OperandsSectionProps = {
  operands: K8sResourceCommon[];
  operandsLoaded: boolean;
  operandsLoadedErrorMessage: string;
  csvName: string;
  cancel?: () => void;
  isDeleteAllOperandsSelected: boolean;
  setIsDeleteAllOperandsSelected: React.Dispatch<React.SetStateAction<boolean>>;
};

export type OperandsTableProps = {
  operands: K8sResourceCommon[];
  loaded: boolean;
  csvName: string;
  cancel?: () => void;
};

export type SubmitResultsProps = {
  operatorUninstallErrorMessage: string;
  name: string;
  namespace: string;
  isDeleteAllOperandsSelected: boolean;
  operandDeletionErrors: OperandWithErrorProps[];
  csvName: string;
  cancel?: () => void;
};

export type OperandWithErrorProps = { operand: K8sResourceCommon; errorMessage: string };
export type OperandErrorsProps = {
  operandsWithErrors?: OperandWithErrorProps[];
  csvName: string;
  cancel?: () => void;
};

UninstallOperatorModal.displayName = 'UninstallOperatorModal';
