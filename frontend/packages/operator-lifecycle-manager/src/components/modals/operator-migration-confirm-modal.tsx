import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
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

type OperatorMigrationConfirmModalOptions = {
  operators: OperatorMigrationTarget[];
  isBulk: boolean;
  monitorMigration: (job: OperatorMigrationJob) => Promise<void>;
  onMigrationStarted?: () => void;
};

type OperatorMigrationConfirmModalProps = OperatorMigrationConfirmModalOptions & {
  closeOverlay: () => void;
};

type AcknowledgementField = keyof OperatorMigrationAcknowledgements;

const acknowledgementFields: {
  field: AcknowledgementField;
  label: string;
  checks: string[];
}[] = [
  // t('I accept that this operator will run in all namespaces after migration.')
  // t('I understand that OLM v1 does not support OperatorCondition.')
  // t('I accept that this operator uses OLM v0 APIs that are unavailable in OLM v1.')
  // t('I accept that this operator will use cluster-admin permissions.')
  // t('I accept migrating this operator before it reaches a healthy, up-to-date state.')
  {
    field: 'acknowledgeWatchScopeChange',
    label: 'I accept that this operator will run in all namespaces after migration.',
    checks: ['No namespace selector', 'AllNamespaces mode', 'Namespace scope change'],
  },
  {
    field: 'acknowledgeOperatorCondition',
    label: 'I understand that OLM v1 does not support OperatorCondition.',
    checks: ['No OperatorCondition usage'],
  },
  {
    field: 'acknowledgeOLMv0APIAccess',
    label: 'I accept that this operator uses OLM v0 APIs that are unavailable in OLM v1.',
    checks: ['OLMv0-API RBAC'],
  },
  {
    field: 'acknowledgeScopedServiceAccount',
    label: 'I accept that this operator will use cluster-admin permissions.',
    checks: ['No scoped ServiceAccount'],
  },
  {
    field: 'acknowledgeNotSteadyState',
    label: 'I accept migrating this operator before it reaches a healthy, up-to-date state.',
    checks: ['Subscription state', 'CSV health'],
  },
];

const operatorKey = (operator: OperatorMigrationRequest): string =>
  `${operator.subscriptionNamespace}/${operator.subscriptionName}`;

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
              {error}
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
                  {t('Run dry run again')}
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
    results: DryRunResult[];
    loading: boolean;
  }>({ requestKey: '', results: [], loading: true });
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

  useEffect(() => {
    let isCurrent = true;
    const loadDryRuns = async () => {
      const results = await Promise.all(
        requests.map(async (request): Promise<DryRunResult> => {
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
        }),
      );
      if (isCurrent) {
        setDryRunState({ requestKey, results, loading: false });
      }
    };

    loadDryRuns().catch((dryRunError: Error) => {
      if (isCurrent) {
        setDryRunState({
          requestKey,
          results: requests.map((request) => ({ request, error: dryRunError.message })),
          loading: false,
        });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [requestKey, requests, t]);

  const eligibleResults = loadingDryRuns
    ? []
    : dryRuns.filter((result) => result.response?.eligible && result.response.plan);
  const eligibleCount = eligibleResults.length;
  const canReview = !loadingDryRuns && eligibleCount > 0 && eligibleCount === requests.length;
  const canMigrate = canReview && reviewedPlan && acknowledgedRecovery && hasRecoveryPlan;

  const resetReview = () => {
    setReviewedPlan(false);
    setAcknowledgedRecovery(false);
    setHasRecoveryPlan(false);
    setError(undefined);
  };

  const rerun = () => {
    resetReview();
    setDryRunAttempt((attempt) => attempt + 1);
  };

  const removeBlockedOperators = () => {
    resetReview();
    setExcludedOperators((current) => [
      ...current,
      ...dryRuns
        .filter((result) => !result.response?.eligible || !result.response.plan)
        .map(({ request }) => operatorKey(request)),
    ]);
  };

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
        message: t('Preparing operator migration'),
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
      onStepChange={() => resetReview()}
      header={
        <WizardHeader
          title={t('Migrate to Next-Gen Operators')}
          titleId="operator-migration-confirm-title"
          description={t('Check the migration plan, then review and start migration.')}
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
          canReview={canReview}
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
              results={dryRuns}
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
                    'Each selected operator must pass the dry run. Review the failed checks, resolve any issues, and run the dry run again.',
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
                    {t('Remove blocked operators')}
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
                        {dryRunError}
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
                                t('This operator did not pass the migration checks.')}
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
        </Stack>
      </WizardStep>
      <WizardStep
        name={t('Review and migrate')}
        id="migration-review"
        isDisabled={!canReview || submitting}
      >
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h2" size="lg">
              {t('Review and migrate')}
            </Title>
            <Content component="p" className="pf-v6-u-mt-sm">
              {t(
                'Migration transfers management to Next-Gen Operators (OLM v1) at the versions shown in the plan.',
              )}
            </Content>
          </StackItem>
          <StackItem>
            <MigrationOperatorsTable
              operators={selectedOperators}
              results={dryRuns}
              loading={loadingDryRuns}
            />
          </StackItem>
          <StackItem>
            <Alert
              isInline
              variant={AlertVariant.warning}
              title={t('Manual recovery might be needed')}
            >
              {t(
                'If migration fails, automatic rollback might not be possible once Next-Gen Operators starts managing the operator. Have a backup or recovery plan for the affected resources before you continue.',
              )}
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
                {t('A failed operator does not stop the remaining operators from migrating.')}
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
                      id="olm-migration-reviewed-plan"
                      data-test="olm-migration-reviewed-plan"
                      label={t('I reviewed the migration plan.')}
                      isChecked={reviewedPlan}
                      onChange={(_, checked) => setReviewedPlan(checked)}
                      isDisabled={submitting}
                    />
                  </StackItem>
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
