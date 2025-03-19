import * as React from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Checkbox,
  Title,
  Form,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  FormGroup,
  AlertActionCloseButton,
  AlertVariant,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import {
  ButtonBar,
  ExternalLink,
  getNetworkPolicyDocURL,
  history,
  isManaged,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { MultiNetworkPolicyModel, NetworkPolicyModel } from '@console/internal/models';
import { k8sCreate, NetworkPolicyKind } from '@console/internal/module/k8s';
import { useClusterNetworkFeatures } from '@console/internal/module/k8s/network';
import { FLAGS, YellowExclamationTriangleIcon } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import NADsSelector from './NADsSelector';
import { NetworkPolicyConditionalSelector } from './network-policy-conditional-selector';
import {
  isNetworkPolicyConversionError,
  NetworkPolicy,
  networkPolicyFromK8sResource,
  networkPolicyNormalizeK8sResource,
  NetworkPolicyRule,
  networkPolicyToK8sResource,
  checkNetworkPolicyValidity,
} from './network-policy-model';
import { NetworkPolicyRuleConfigPanel } from './network-policy-rule-config';
import { NetworkPolicySelectorPreview } from './network-policy-selector-preview';
import useIsMultiNetworkPolicy from './useIsMultiNetworkPolicy';

const emptyRule = (): NetworkPolicyRule => {
  return {
    key: _.uniqueId(),
    peers: [],
    ports: [],
  };
};

type NetworkPolicyFormProps = {
  formData: NetworkPolicyKind;
  onChange: (newFormData: NetworkPolicyKind) => void;
};

export const NetworkPolicyForm: React.FC<NetworkPolicyFormProps> = ({ formData, onChange }) => {
  const { t } = useTranslation();
  const isOpenShift = useFlag(FLAGS.OPENSHIFT);

  const { ns: namespace } = useParams();

  const normalizedK8S = networkPolicyNormalizeK8sResource(formData);
  const converted = networkPolicyFromK8sResource(normalizedK8S, t);
  const [networkPolicy, setNetworkPolicy] = React.useState(converted);

  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showSDNAlert, setShowSDNAlert] = React.useState(true);
  const [networkFeatures, networkFeaturesLoaded] = useClusterNetworkFeatures();
  const podsPreviewPopoverRef = React.useRef();

  const isMulti = useIsMultiNetworkPolicy();

  const model = isMulti ? MultiNetworkPolicyModel : NetworkPolicyModel;

  if (isNetworkPolicyConversionError(networkPolicy)) {
    // Note, this case is not expected to happen. Validity of the network policy for form should have been checked prior to showing this form.
    // When used with the SyncedEditor, an error is thrown when the data is invalid, that should prevent the user from opening the form with invalid data, hence not running into this conditional block.
    return (
      <div className="co-m-pane__body">
        <Alert
          variant={AlertVariant.danger}
          title={t(
            'console-app~This NetworkPolicy cannot be displayed in form. Please switch to the YAML editor.',
          )}
        >
          {networkPolicy.error}
        </Alert>
      </div>
    );
  }

  const onPolicyChange = (policy: NetworkPolicy) => {
    setNetworkPolicy(policy);
    onChange(networkPolicyToK8sResource(policy, isMulti));
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    onPolicyChange({ ...networkPolicy, name: event.currentTarget.value });

  const handleMainPodSelectorChange = (updated: string[][]) => {
    onPolicyChange({ ...networkPolicy, podSelector: updated });
  };

  const handleDenyAllIngress: React.ReactEventHandler<HTMLInputElement> = (event) =>
    onPolicyChange({
      ...networkPolicy,
      ingress: { ...networkPolicy.ingress, denyAll: event.currentTarget.checked },
    });

  const handleDenyAllEgress: React.ReactEventHandler<HTMLInputElement> = (event) =>
    onPolicyChange({
      ...networkPolicy,
      egress: { ...networkPolicy.egress, denyAll: event.currentTarget.checked },
    });

  const updateIngressRules = (rules: NetworkPolicyRule[]) =>
    onPolicyChange({ ...networkPolicy, ingress: { ...networkPolicy.ingress, rules } });

  const updateEgressRules = (rules: NetworkPolicyRule[]) =>
    onPolicyChange({ ...networkPolicy, egress: { ...networkPolicy.egress, rules } });

  const addIngressRule = () => {
    updateIngressRules([emptyRule(), ...networkPolicy.ingress.rules]);
  };

  const addEgressRule = () => {
    updateEgressRules([emptyRule(), ...networkPolicy.egress.rules]);
  };

  const removeAll = (msg: string, execute: () => void) => {
    confirmModal({
      title: (
        <>
          <YellowExclamationTriangleIcon className="co-icon-space-r" />
          {t('console-app~Are you sure?')}
        </>
      ),
      message: msg,
      btnText: t('console-app~Remove all'),
      executeFn: () => {
        execute();
        return Promise.resolve();
      },
    });
  };

  const removeAllIngress = () => {
    removeAll(
      t(
        'console-app~This action will remove all rules within the Ingress section and cannot be undone.',
      ),
      () => updateIngressRules([]),
    );
  };

  const removeAllEgress = () => {
    removeAll(
      t(
        'console-app~This action will remove all rules within the Egress section and cannot be undone.',
      ),
      () => updateEgressRules([]),
    );
  };

  const removeIngressRule = (idx: number) => {
    updateIngressRules([
      ...networkPolicy.ingress.rules.slice(0, idx),
      ...networkPolicy.ingress.rules.slice(idx + 1),
    ]);
  };

  const removeEgressRule = (idx: number) => {
    updateEgressRules([
      ...networkPolicy.egress.rules.slice(0, idx),
      ...networkPolicy.egress.rules.slice(idx + 1),
    ]);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();

    const invalid = checkNetworkPolicyValidity(networkPolicy, t);
    if (invalid) {
      setError(invalid.error);
      return;
    }

    const policy = networkPolicyToK8sResource(networkPolicy, isMulti);
    setInProgress(true);
    k8sCreate(model, policy)
      .then(() => {
        setInProgress(false);
        history.push(resourcePathFromModel(model, networkPolicy.name, networkPolicy.namespace));
      })
      .catch((err) => {
        setError(err.message);
        setInProgress(false);
      });
  };

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Form onSubmit={save} className="co-create-networkpolicy">
        {showSDNAlert &&
          networkFeaturesLoaded &&
          networkFeatures?.PolicyEgress === undefined &&
          networkFeatures?.PolicyPeerIPBlockExceptions === undefined && (
            <Alert
              variant="info"
              title={t('console-app~When using the OpenShift SDN cluster network provider:')}
              actionClose={<AlertActionCloseButton onClose={() => setShowSDNAlert(false)} />}
            >
              <ul>
                <li>{t('console-app~Egress network policy is not supported.')}</li>
                <li>
                  {t(
                    'console-app~IP block exceptions are not supported and would cause the entire IP block section to be ignored.',
                  )}
                </li>
              </ul>
              <p>
                {t('Refer to your cluster administrator to know which network provider is used.')}
              </p>
              {!isManaged() && (
                <p>
                  {t('console-app~More information:')}&nbsp;
                  <ExternalLink
                    href={getNetworkPolicyDocURL(isOpenShift)}
                    text={t('console-app~NetworkPolicies documentation')}
                  />
                </p>
              )}
            </Alert>
          )}
        <div className="form-group co-create-networkpolicy__name">
          <label className="co-required" htmlFor="name">
            {t('console-app~Policy name')}
          </label>
          <span className="pf-v6-c-form-control">
            <input
              type="text"
              onChange={handleNameChange}
              value={networkPolicy.name}
              placeholder="my-policy"
              id="name"
              name="name"
              required
            />
          </span>
        </div>
        {isMulti && (
          <NADsSelector
            namespace={namespace as string}
            networkPolicy={networkPolicy}
            onPolicyChange={onPolicyChange}
          />
        )}
        <div className="form-group co-create-networkpolicy__podselector">
          <NetworkPolicyConditionalSelector
            selectorType="pod"
            helpText={t(
              'console-app~If no pod selector is provided, the policy will apply to all pods in the namespace.',
            )}
            values={networkPolicy.podSelector}
            onChange={handleMainPodSelectorChange}
            dataTest="main-pod-selector"
          />
          <p>
            <Trans ns="console-app">
              Show a preview of the{' '}
              <Button
                data-test="show-affected-pods"
                ref={podsPreviewPopoverRef}
                variant="link"
                isInline
              >
                affected pods
              </Button>{' '}
              that this policy will apply to
            </Trans>
          </p>
          <NetworkPolicySelectorPreview
            policyNamespace={networkPolicy.namespace}
            podSelector={networkPolicy.podSelector}
            popoverRef={podsPreviewPopoverRef}
            dataTest="policy-pods-preview"
          />
        </div>
        <Title headingLevel="h2">{t('console-app~Policy type')}</Title>
        <FormGroup
          role="group"
          isInline
          label={t('console-app~Select default ingress and egress deny rules')}
        >
          <Checkbox
            label={t('console-app~Deny all ingress traffic')}
            onChange={handleDenyAllIngress}
            isChecked={networkPolicy.ingress.denyAll}
            name="denyAllIngress"
            id="denyAllIngress"
          />
          {networkFeaturesLoaded && networkFeatures.PolicyEgress !== false && (
            <Checkbox
              label={t('console-app~Deny all egress traffic')}
              onChange={handleDenyAllEgress}
              isChecked={networkPolicy.egress.denyAll}
              name="denyAllEgress"
              id="denyAllEgress"
            />
          )}
        </FormGroup>
        {!networkPolicy.ingress.denyAll && (
          <FormFieldGroupExpandable
            toggleAriaLabel="Ingress"
            className="co-create-networkpolicy__expandable-xl"
            isExpanded
            header={
              <FormFieldGroupHeader
                titleText={{ text: t('console-app~Ingress'), id: 'ingress-header' }}
                titleDescription={t(
                  'console-app~Add ingress rules to be applied to your selected pods. Traffic is allowed from pods if it matches at least one rule.',
                )}
                actions={
                  <>
                    <Button
                      variant="link"
                      isDisabled={networkPolicy.ingress.rules.length === 0}
                      onClick={removeAllIngress}
                      data-test="remove-all-ingress"
                    >
                      {t('console-app~Remove all')}
                    </Button>
                    <Button data-test="add-ingress" variant="secondary" onClick={addIngressRule}>
                      {t('console-app~Add ingress rule')}
                    </Button>
                  </>
                }
              />
            }
          >
            {networkPolicy.ingress.rules.map((rule, idx) => (
              <NetworkPolicyRuleConfigPanel
                key={rule.key}
                policyNamespace={networkPolicy.namespace}
                direction="ingress"
                rule={rule}
                onChange={(r) => {
                  const newRules = [...networkPolicy.ingress.rules];
                  newRules[idx] = r;
                  updateIngressRules(newRules);
                }}
                onRemove={() => removeIngressRule(idx)}
              />
            ))}
          </FormFieldGroupExpandable>
        )}
        {!networkPolicy.egress.denyAll &&
          networkFeaturesLoaded &&
          networkFeatures.PolicyEgress !== false && (
            <FormFieldGroupExpandable
              toggleAriaLabel="Egress"
              className="co-create-networkpolicy__expandable-xl"
              isExpanded
              header={
                <FormFieldGroupHeader
                  titleText={{ text: t('console-app~Egress'), id: 'egress-header' }}
                  titleDescription={t(
                    'console-app~Add egress rules to be applied to your selected pods. Traffic is allowed to pods if it matches at least one rule.',
                  )}
                  actions={
                    <>
                      <Button
                        variant="link"
                        isDisabled={networkPolicy.egress.rules.length === 0}
                        onClick={removeAllEgress}
                        data-test="remove-all-egress"
                      >
                        {t('console-app~Remove all')}
                      </Button>
                      <Button data-test="add-egress" variant="secondary" onClick={addEgressRule}>
                        {t('console-app~Add egress rule')}
                      </Button>
                    </>
                  }
                />
              }
            >
              {networkPolicy.egress.rules.map((rule, idx) => (
                <NetworkPolicyRuleConfigPanel
                  key={rule.key}
                  policyNamespace={networkPolicy.namespace}
                  direction="egress"
                  rule={rule}
                  onChange={(r) => {
                    const newRules = [...networkPolicy.egress.rules];
                    newRules[idx] = r;
                    updateEgressRules(newRules);
                  }}
                  onRemove={() => removeEgressRule(idx)}
                />
              ))}
            </FormFieldGroupExpandable>
          )}
        <ButtonBar errorMessage={error} inProgress={inProgress}>
          <ActionGroup className="pf-v6-c-form">
            <Button type="submit" id="save-changes" variant="primary">
              {t('console-app~Create')}
            </Button>
            <Button onClick={history.goBack} id="cancel" variant="secondary">
              {t('console-app~Cancel')}
            </Button>
          </ActionGroup>
        </ButtonBar>
      </Form>
    </div>
  );
};
