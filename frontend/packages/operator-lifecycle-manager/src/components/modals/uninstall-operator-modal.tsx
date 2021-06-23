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
import { GLOBAL_OPERATOR_NAMESPACE, OPERATOR_UNINSTALL_MESSAGE_ANNOTATION } from '../../const';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../models';
import { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import { getClusterServiceVersionPlugins, isPluginEnabled, getPluginPatch } from '../../utils';
import { OperandLink } from '../operand/operand-link';

const areOperandDeletionErrors = (operandDeletionErrors: OperandWithErrorProps[]): boolean =>
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
  const [handleOperandsDeletePromise, operandsDeleteInProgress] = usePromisesAllSettledHandler();
  const [deleteAllOperands, setDeleteAllOperands] = React.useState(false);
  const [operandDeletionErrors, setOperandDeletionErrors] = React.useState<OperandWithErrorProps[]>(
    [],
  );
  const [
    operandDeletionErrorProcessingFinished,
    setOperandDeletionErrorProcessingFinished,
  ] = React.useState(false);

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
      (deleteAllOperands ? operandDeletionErrorProcessingFinished : true) &&
      operatorUninstallFinished,
    [
      isSubmitInProgress,
      deleteAllOperands,
      operandDeletionErrorProcessingFinished,
      operatorUninstallFinished,
    ],
  );

  const areSubmitErrors = React.useMemo(
    () =>
      areOperandDeletionErrors(operandDeletionErrors) || operatorUninstallErrorMessage.length > 0,
    [operandDeletionErrors, operatorUninstallErrorMessage],
  );

  const {
    loaded: operandsLoaded,
    errorMessage: operandsLoadedErrorMessage,
    operands,
  } = useOperands(subscriptionName, subscriptionNamespace);

  const closeAndRedirect = React.useCallback(() => {
    close();
    if (
      window.location.pathname.split('/').includes(subscription.metadata.name) ||
      window.location.pathname.split('/').includes(subscription?.status?.installedCSV)
    ) {
      history.push(resourceListPathFromModel(ClusterServiceVersionModel, getActiveNamespace()));
    }
  }, [close, subscription]);

  React.useEffect(() => {
    if (isSubmitFinished && !areSubmitErrors) {
      closeAndRedirect();
    }
  }, [closeAndRedirect, areSubmitErrors, isSubmitFinished]);

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
    const operandDeletionPromises = deleteAllOperands
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
          setOperandDeletionErrorProcessingFinished(true);
        },
      );
    }
    setOperandDeletionErrorProcessingFinished(!deleteAllOperands);

    // TODO .finally causes "ESLint: Expected catch() or return (promise/catch-or-return)" !?
    handleOperatorUninstallPromise(Promise.all(operatorUninstallPromises))
      .then(() => {
        setOperatorUninstallFinished(true);
      })
      .catch(() => {
        setOperatorUninstallFinished(true);
      });
    /* .finally(() => {
        setOperatorUninstallFinished(true);
      }); */
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
              deleteAllOperands={deleteAllOperands}
              setDeleteAllOperands={setDeleteAllOperands}
            />
          </>
        ) : (
          <SubmitResults
            operatorUninstallErrorMessage={operatorUninstallErrorMessage}
            name={name}
            namespace={namespace}
            deleteAllOperands={deleteAllOperands}
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
  deleteAllOperands,
  setDeleteAllOperands,
}) => {
  const { t } = useTranslation();
  return operandsLoadedErrorMessage ? (
    <OperandsLoadAlert operandsLoadedErrorMessage={operandsLoadedErrorMessage} />
  ) : (
    (!operandsLoaded || (operandsLoaded && operands.length > 0)) && (
      <>
        <h2>{t('olm~Operand instances')}</h2>
        <OperandsTable
          operands={operands}
          loaded={operandsLoaded}
          csvName={csvName}
          cancel={cancel} // for breadcrumbs & cancel modal when clicking on operand links
        />
        <Checkbox
          onChange={({ currentTarget }) => setDeleteAllOperands(currentTarget.checked)}
          name="delete-all-operands"
          label={t('olm~Delete all operand instances for this operator')}
          checked={deleteAllOperands}
        />
      </>
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

const OperatorUninstallError: React.FC<{ operatorUninstallErrorMessage: string }> = ({
  operatorUninstallErrorMessage,
}) => {
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
        {operatorUninstallErrorMessage}
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

const SubmitResults: React.FC<SubmitResultsProps> = ({
  operatorUninstallErrorMessage,
  name,
  namespace,
  deleteAllOperands,
  operandDeletionErrors,
  csvName,
  cancel,
}) => {
  const alerts = [];
  alerts.push(
    operatorUninstallErrorMessage ? (
      <OperatorUninstallError operatorUninstallErrorMessage={operatorUninstallErrorMessage} />
    ) : (
      <OperatorUninstallSuccess name={name} namespace={namespace} />
    ),
  );
  if (deleteAllOperands) {
    alerts.push(
      areOperandDeletionErrors(operandDeletionErrors) ? (
        <OperandDeletionErrors
          operandDeletionErrors={operandDeletionErrors}
          csvName={csvName}
          cancel={cancel}
        />
      ) : (
        <OperandDeletionSuccess name={name} namespace={namespace} />
      ),
    );
  }
  return <>{alerts}</>;
};

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
  deleteAllOperands: boolean;
  setDeleteAllOperands: React.Dispatch<React.SetStateAction<boolean>>;
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
  deleteAllOperands: boolean;
  operandDeletionErrors: OperandWithErrorProps[];
  csvName: string;
  cancel?: () => void;
};

export type OperandWithErrorProps = { operand: K8sResourceCommon; errorMessage: any };
export type OperandErrorsProps = {
  operandsWithErrors?: OperandWithErrorProps[];
  csvName: string;
  cancel?: () => void;
};

UninstallOperatorModal.displayName = 'UninstallOperatorModal';
