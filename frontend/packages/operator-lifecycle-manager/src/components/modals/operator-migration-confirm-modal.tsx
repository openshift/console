import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertVariant,
  Button,
  Checkbox,
  Content,
  Flex,
  Form,
  FormGroup,
  Modal,
  ModalVariant,
  Stack,
  StackItem,
  Title,
  Wizard,
  WizardFooterWrapper,
  WizardHeader,
  WizardStep,
  useWizardContext,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import type {
  OperatorMigrationAcknowledgements,
  OperatorMigrationJob,
  OperatorMigrationRequest,
} from '../../utils/operator-migration-api';
import {
  dryRunOperatorMigration,
  startOperatorMigration,
} from '../../utils/operator-migration-api';
import type { OperatorMigrationTarget, DryRunResult } from './operator-migration-plan';
import { MigrationOperatorsTable, MigrationPlanDetails } from './operator-migration-plan';

interface OperatorMigrationConfirmModalOptions {
  operators: OperatorMigrationTarget[];
  isBulk: boolean;
  monitorMigration: (job: OperatorMigrationJob) => Promise<void>;
  onMigrationStarted?: () => void;
}

interface OperatorMigrationConfirmModalProps extends OperatorMigrationConfirmModalOptions {
  closeOverlay: () => void;
}

type AcknowledgementField = keyof OperatorMigrationAcknowledgements;

const acknowledgementFields: {
  field: AcknowledgementField;
  label: string;
  checks: string[];
}[] = [
  // t('I accept that this Operator runs in all namespaces after migration.')
  // t('I understand that cluster extensions do not support OperatorCondition, so the Operator cannot use it to block upgrades when it is not ready.')
  // t('I accept that this Operator uses Operator Lifecycle Manager version 0 APIs that cluster extensions do not support, so features that depend on those APIs might stop working after migration.')
  // t('I accept that this Operator uses cluster-admin permissions after migration.')
  // t('I accept migrating this Operator before it reaches a healthy, up-to-date state.')
  {
    field: 'acknowledgeWatchScopeChange',
    label: 'I accept that this Operator runs in all namespaces after migration.',
    checks: ['No namespace selector', 'AllNamespaces mode', 'Namespace scope change'],
  },
  {
    field: 'acknowledgeOperatorCondition',
    label:
      'I understand that cluster extensions do not support OperatorCondition, so the Operator cannot use it to block upgrades when it is not ready.',
    checks: ['No OperatorCondition usage'],
  },
  {
    field: 'acknowledgeOLMv0APIAccess',
    label:
      'I accept that this Operator uses Operator Lifecycle Manager version 0 APIs that cluster extensions do not support, so features that depend on those APIs might stop working after migration.',
    checks: ['OLMv0-API RBAC'],
  },
  {
    field: 'acknowledgeScopedServiceAccount',
    label: 'I accept that this Operator uses cluster-admin permissions after migration.',
    checks: ['No scoped ServiceAccount'],
  },
  {
    field: 'acknowledgeNotSteadyState',
    label: 'I accept migrating this Operator before it reaches a healthy, up-to-date state.',
    checks: ['Subscription state', 'CSV health'],
  },
];

/** Identifies a source operator by namespace and Subscription name for plan and selection matching. */
const operatorKey = (operator: OperatorMigrationRequest): string =>
  `${operator.subscriptionNamespace}/${operator.subscriptionName}`;

/** Controls wizard navigation and prevents migration before review and required acknowledgments. */
const MigrationWizardFooter: FC<{
  loading: boolean;
  submitting: boolean;
  canReview: boolean;
  canMigrate: boolean;
  isBulk: boolean;
  eligibleCount: number;
  error?: string;
  rerun: () => void;
  submit: () => void;
}> = ({
  loading,
  submitting,
  canReview,
  canMigrate,
  isBulk,
  eligibleCount,
  error,
  rerun,
  submit,
}) => {
  const { t } = useTranslation('olm');
  const { activeStep, goToNextStep, goToPrevStep, close } = useWizardContext();
  const isReview = activeStep.id === 'migration-review';
  return (
    <WizardFooterWrapper>
      <Stack hasGutter>
        {error && (
          <StackItem>
            <Alert isInline variant={AlertVariant.danger} title={t('Could not start migration')}>
              <Content component="p">{error}</Content>
              <Content component="p">{t('Resolve the reported issue, then try again.')}</Content>
            </Alert>
          </StackItem>
        )}
        <StackItem>
          <Flex>
            {isReview ? (
              <>
                <Button variant="secondary" onClick={goToPrevStep} isDisabled={submitting}>
                  {t('Back')}
                </Button>
                <Button
                  variant="danger"
                  onClick={submit}
                  isLoading={submitting}
                  isDisabled={!canMigrate || submitting}
                  data-test="confirm-operator-migration"
                >
                  {isBulk
                    ? t('Start migration ({{eligibleCount}})', { eligibleCount })
                    : t('Start migration')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={goToNextStep}
                  isDisabled={!canReview}
                  data-test="review-operator-migration"
                >
                  {t('Review migration')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={rerun}
                  isDisabled={loading}
                  data-test="rerun-operator-migration"
                >
                  {t('Repeat dry run')}
                </Button>
              </>
            )}
            <Button variant="link" onClick={close} isDisabled={submitting}>
              {t('Cancel')}
            </Button>
          </Flex>
        </StackItem>
      </Stack>
    </WizardFooterWrapper>
  );
};

/** Loads dry-run plans, resolves blocked selections, and queues an acknowledged asynchronous migration. */
const OperatorMigrationConfirmModal: FC<OperatorMigrationConfirmModalProps> = ({
  operators,
  isBulk,
  monitorMigration,
  onMigrationStarted,
  closeOverlay,
}) => {
  const { t } = useTranslation('olm');
  const [acknowledgements, setAcknowledgements] = useState<
    Record<string, OperatorMigrationAcknowledgements>
  >({});
  const [dryRunState, setDryRunState] = useState<{
    requestKey: string;
    attempt: number;
    results: DryRunResult[];
    loading: boolean;
  }>({ requestKey: '', attempt: 0, results: [], loading: true });
  const dryRunRequests = useRef(
    new Map<string, { requestKey: string; result: Promise<DryRunResult> }>(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [excludedOperators, setExcludedOperators] = useState<string[]>([]);
  const [dryRunAttempt, setDryRunAttempt] = useState(0);
  const [reviewedPlan, setReviewedPlan] = useState(false);
  const [acknowledgedRecovery, setAcknowledgedRecovery] = useState(false);
  const [hasRecoveryPlan, setHasRecoveryPlan] = useState(false);
  const selectedOperators = useMemo(
    () => operators.filter((operator) => !excludedOperators.includes(operatorKey(operator))),
    [operators, excludedOperators],
  );

  const requests = useMemo(
    () =>
      selectedOperators.map((operator) => ({
        subscriptionName: operator.subscriptionName,
        subscriptionNamespace: operator.subscriptionNamespace,
        clusterExtensionName: operator.clusterExtensionName,
        installNamespace: operator.installNamespace,
        ...acknowledgements[operatorKey(operator)],
      })),
    [acknowledgements, selectedOperators],
  );
  const requestKey = JSON.stringify([requests, dryRunAttempt]);
  const loadingDryRuns = dryRunState.loading || dryRunState.requestKey !== requestKey;
  const dryRuns = dryRunState.results.filter(({ request }) =>
    selectedOperators.some((operator) => operatorKey(operator) === operatorKey(request)),
  );
  const currentDryRuns =
    dryRunState.attempt === dryRunAttempt
      ? dryRuns.filter(({ request }) =>
          requests.some((candidate) => JSON.stringify(candidate) === JSON.stringify(request)),
        )
      : [];

  useEffect(() => {
    let isCurrent = true;
    /** Reuses unchanged operator checks and discards results from an obsolete or closed review. */
    const loadDryRuns = async () => {
      const results = await Promise.all(
        requests.map((request): Promise<DryRunResult> => {
          const key = operatorKey(request);
          const operatorRequestKey = JSON.stringify([request, dryRunAttempt]);
          const cached = dryRunRequests.current.get(key);
          if (cached?.requestKey === operatorRequestKey) {
            return cached.result;
          }
          const result = (async (): Promise<DryRunResult> => {
            try {
              return { request, response: await dryRunOperatorMigration(request) };
            } catch (dryRunError) {
              return {
                request,
                error:
                  dryRunError instanceof Error
                    ? dryRunError.message
                    : t('Dry run failed. Try again.'),
              };
            }
          })();
          dryRunRequests.current.set(key, { requestKey: operatorRequestKey, result });
          return result;
        }),
      );
      if (isCurrent) {
        setDryRunState({ requestKey, attempt: dryRunAttempt, results, loading: false });
      }
    };

    loadDryRuns().catch((dryRunError: Error) => {
      if (isCurrent) {
        setDryRunState({
          requestKey,
          attempt: dryRunAttempt,
          results: requests.map((request) => ({ request, error: dryRunError.message })),
          loading: false,
        });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [dryRunAttempt, requestKey, requests, t]);

  const eligibleResults = loadingDryRuns
    ? []
    : dryRuns.filter((result) => result.response?.eligible && result.response.plan);
  const eligibleCount = eligibleResults.length;
  const canReview = !loadingDryRuns && eligibleCount > 0 && eligibleCount === requests.length;
  const canMigrate = canReview && reviewedPlan && acknowledgedRecovery && hasRecoveryPlan;

  /** Requires fresh recovery acknowledgments when returning to the migration confirmation step. */
  const resetRecoveryAcknowledgements = () => {
    setAcknowledgedRecovery(false);
    setHasRecoveryPlan(false);
    setError(undefined);
  };

  /** Clears completed review and acknowledgments when migration inputs change. */
  const resetReview = () => {
    setReviewedPlan(false);
    resetRecoveryAcknowledgements();
  };

  /** Refreshes dry-run plans and resets the previous review state. */
  const rerun = () => {
    resetReview();
    setDryRunAttempt((attempt) => attempt + 1);
  };

  /** Keeps only targets with successful eligible dry runs and requires another review. */
  const removeBlockedOperators = () => {
    resetReview();
    setExcludedOperators((current) => [
      ...current,
      ...dryRuns
        .filter((result) => !result.response?.eligible || !result.response.plan)
        .map(({ request }) => operatorKey(request)),
    ]);
  };

  /** Updates one migration-risk acknowledgment without changing the remaining choices. */
  const toggleAcknowledgement = (
    operator: OperatorMigrationRequest,
    field: AcknowledgementField,
  ) => {
    resetReview();
    const key = operatorKey(operator);
    setAcknowledgements((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: !current[key]?.[field],
      },
    }));
  };

  /** Queues eligible targets, starts context monitoring, and reports submission errors in the dialog. */
  const submitMigration = async () => {
    if (!canMigrate || submitting) {
      return;
    }
    setSubmitting(true);
    setError(undefined);
    try {
      const { jobID } = await startOperatorMigration(eligibleResults.map(({ request }) => request));
      const initialJob: OperatorMigrationJob = {
        id: jobID,
        status: 'Queued',
        continueOnError: true,
        message: t('Preparing Operator migration'),
        items: eligibleResults.map(({ request }) => ({
          subscriptionName: request.subscriptionName,
          subscriptionNamespace: request.subscriptionNamespace,
          status: 'Queued',
        })),
      };
      monitorMigration(initialJob);
      onMigrationStarted?.();
      closeOverlay();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : t('Could not start migration.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Wizard
      navAriaLabel={t('Migration steps')}
      onClose={closeOverlay}
      isVisitRequired
      onStepChange={resetRecoveryAcknowledgements}
      header={
        <WizardHeader
          title={t('Migrate Classic Operators to cluster extensions')}
          titleId="operator-migration-confirm-title"
          description={t('Check the migration plan, then review and start the migration.')}
          descriptionId="operator-migration-confirm-description"
          onClose={submitting ? undefined : closeOverlay}
          isCloseHidden={submitting}
          closeButtonAriaLabel={t('Close migration dialog')}
        />
      }
      footer={
        <MigrationWizardFooter
          loading={loadingDryRuns}
          submitting={submitting}
          canReview={canReview && reviewedPlan}
          canMigrate={canMigrate}
          isBulk={isBulk}
          eligibleCount={eligibleCount}
          error={error}
          rerun={rerun}
          submit={submitMigration}
        />
      }
    >
      <WizardStep name={t('Check migration')} id="migration-check" isDisabled={submitting}>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h2" size="lg">
              {t('Check migration')}
            </Title>
            <Content component="p" className="pf-v6-u-mt-sm">
              {t(
                'A dry run checks migration requirements and shows planned changes without changing cluster resources.',
              )}
            </Content>
          </StackItem>
          <StackItem aria-live="polite" aria-busy={loadingDryRuns}>
            <MigrationOperatorsTable
              operators={selectedOperators}
              results={currentDryRuns}
              loading={loadingDryRuns}
            />
          </StackItem>
          {!loadingDryRuns && !canReview && (
            <StackItem>
              <Alert
                isInline
                variant={AlertVariant.warning}
                title={t('Resolve migration blockers')}
              >
                <Content component="p">
                  {t(
                    'Each selected Operator must pass the dry run. Review the failed checks, resolve any issues, and repeat the dry run.',
                  )}
                </Content>
                {isBulk && eligibleCount > 0 && (
                  <Button
                    data-test="remove-blocked-operators"
                    variant="link"
                    isInline
                    onClick={removeBlockedOperators}
                    className="pf-v6-u-mt-sm"
                  >
                    {t('Remove blocked Operators')}
                  </Button>
                )}
              </Alert>
            </StackItem>
          )}
          {!loadingDryRuns && canReview && (
            <StackItem>
              <Alert isInline variant={AlertVariant.success} title={t('Ready to review')}>
                {t('The dry run passed. Review the migration plan before starting.')}
              </Alert>
            </StackItem>
          )}
          {dryRuns.map(({ request, response, error: dryRunError }) => {
            const operator = selectedOperators.find(
              (candidate) => operatorKey(candidate) === operatorKey(request),
            );
            const displayName = operator?.displayName || request.subscriptionName;
            const failedChecks =
              response?.operator.failedChecks?.filter(({ passed }) => !passed) ?? [];
            const availableAcknowledgements = acknowledgementFields.filter(
              ({ field, checks }) =>
                acknowledgements[operatorKey(request)]?.[field] ||
                failedChecks.some(({ name }) => checks.includes(name)),
            );
            return (
              <StackItem key={operatorKey(request)}>
                <Stack hasGutter>
                  {dryRunError ? (
                    <StackItem>
                      <Alert
                        isInline
                        variant={AlertVariant.danger}
                        title={t('Could not check {{operator}}', { operator: displayName })}
                      >
                        <Content component="p">{dryRunError}</Content>
                        <Content component="p">
                          {t('Resolve the reported issue, then select Repeat dry run.')}
                        </Content>
                      </Alert>
                    </StackItem>
                  ) : response ? (
                    <>
                      {!response.eligible && (
                        <StackItem>
                          <Alert
                            isInline
                            variant={AlertVariant.warning}
                            title={t('Migration blocked for {{operator}}', {
                              operator: displayName,
                            })}
                          >
                            <Content component="p">
                              {response.planningError ||
                                response.operator.reason ||
                                t(
                                  'This Operator did not pass the migration checks. Resolve the failed checks, then repeat the dry run.',
                                )}
                            </Content>
                            {failedChecks.length > 0 && (
                              <Content component="ul" className="pf-v6-u-mt-sm">
                                {failedChecks.map((check) => (
                                  <Content component="li" key={check.name}>
                                    <strong>{check.name}:</strong> {check.message}
                                  </Content>
                                ))}
                              </Content>
                            )}
                          </Alert>
                        </StackItem>
                      )}
                      {availableAcknowledgements.map(({ field, label }) => (
                        <StackItem key={field}>
                          <Checkbox
                            id={`olm-migration-${encodeURIComponent(operatorKey(request))}-${field}`}
                            label={t(label)}
                            isChecked={Boolean(acknowledgements[operatorKey(request)]?.[field])}
                            onChange={() => toggleAcknowledgement(request, field)}
                            isDisabled={loadingDryRuns || submitting}
                            description={displayName}
                          />
                        </StackItem>
                      ))}
                      {response.operator.warnings?.length > 0 && (
                        <StackItem>
                          <Alert
                            isInline
                            variant={AlertVariant.warning}
                            title={t('Review changes for {{operator}}', { operator: displayName })}
                          >
                            <Content component="ul">
                              {response.operator.warnings.map((warning) => (
                                <Content component="li" key={warning}>
                                  {warning}
                                </Content>
                              ))}
                            </Content>
                          </Alert>
                        </StackItem>
                      )}
                      {response.plan && (
                        <StackItem>
                          <MigrationPlanDetails plan={response.plan} displayName={displayName} />
                        </StackItem>
                      )}
                    </>
                  ) : null}
                </Stack>
              </StackItem>
            );
          })}
          <StackItem>
            <Form>
              <FormGroup
                label={t('Confirm dry run review')}
                fieldId="operator-migration-dry-run-review"
                role="group"
                isRequired
              >
                <Checkbox
                  id="olm-migration-reviewed-plan"
                  data-test="olm-migration-reviewed-plan"
                  label={t('I reviewed the migration plan.')}
                  isChecked={reviewedPlan}
                  onChange={(_, checked) => setReviewedPlan(checked)}
                  isDisabled={!canReview || submitting}
                />
              </FormGroup>
            </Form>
          </StackItem>
        </Stack>
      </WizardStep>
      <WizardStep
        name={t('Review and migrate')}
        id="migration-review"
        isDisabled={!canReview || !reviewedPlan || submitting}
      >
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h2" size="lg">
              {t('Review and migrate')}
            </Title>
            <Content component="p" className="pf-v6-u-mt-sm">
              {t(
                'Migration transfers management to Operator Lifecycle Manager version 1 cluster extensions at the versions shown in the plan.',
              )}
            </Content>
          </StackItem>
          <StackItem>
            <MigrationOperatorsTable
              operators={selectedOperators}
              results={currentDryRuns}
              loading={loadingDryRuns}
            />
          </StackItem>
          <StackItem>
            <Alert isInline variant={AlertVariant.warning} title={t('Prepare for manual recovery')}>
              {t(
                'If migration fails, automatic rollback might not be possible after Operator Lifecycle Manager version 1 cluster extensions start managing the Operator. Before you continue, make sure you have a backup or recovery plan for the affected resources.',
              )}
              <Content component="p" className="pf-v6-u-mt-sm">
                {t(
                  'If automatic rollback does not finish, use the rollback action in the failure notification after the migration batch finishes. Review the affected resources before you confirm rollback. If rollback still fails, use your backup or recovery plan.',
                )}
              </Content>
            </Alert>
          </StackItem>
          <StackItem>
            <Content component="p">
              {t(
                'Migration runs in the background. Follow progress and results in the migration notifications.',
              )}
            </Content>
            {isBulk && (
              <Content component="p" className="pf-v6-u-mt-sm">
                {t(
                  'If an Operator fails to migrate, the console continues migrating the remaining Operators.',
                )}
              </Content>
            )}
          </StackItem>
          <StackItem>
            <Form>
              <FormGroup
                label={t('Confirm before migrating')}
                fieldId="operator-migration-review"
                isRequired
              >
                <Stack hasGutter>
                  <StackItem>
                    <Checkbox
                      id="olm-migration-acknowledged-recovery"
                      data-test="olm-migration-acknowledged-recovery"
                      label={t(
                        'I understand that a failed migration might require manual recovery.',
                      )}
                      isChecked={acknowledgedRecovery}
                      onChange={(_, checked) => setAcknowledgedRecovery(checked)}
                      isDisabled={submitting}
                    />
                  </StackItem>
                  <StackItem>
                    <Checkbox
                      id="olm-migration-recovery-plan"
                      data-test="olm-migration-recovery-plan"
                      label={t('I have a backup or recovery plan for the affected resources.')}
                      isChecked={hasRecoveryPlan}
                      onChange={(_, checked) => setHasRecoveryPlan(checked)}
                      isDisabled={submitting}
                    />
                  </StackItem>
                </Stack>
              </FormGroup>
            </Form>
          </StackItem>
        </Stack>
      </WizardStep>
    </Wizard>
  );
};

/** Mounts the migration wizard in the Console overlay with an externally supplied monitor callback. */
export const OperatorMigrationConfirmModalOverlay: OverlayComponent<
  OperatorMigrationConfirmModalOptions
> = (props) => (
  <Modal
    data-test="operator-migration-modal"
    variant={ModalVariant.large}
    isOpen
    onEscapePress={props.closeOverlay}
    aria-labelledby="operator-migration-confirm-title"
    aria-describedby="operator-migration-confirm-description"
  >
    <OperatorMigrationConfirmModal {...props} />
  </Modal>
);
