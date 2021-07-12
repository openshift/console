import * as React from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Title,
  Form,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  AlertActionCloseButton,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@console/internal/components/checkbox';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import { ButtonBar, history, resourcePathFromModel } from '@console/internal/components/utils';
import { NetworkPolicyModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';
import { NetworkPolicyConditionalSelector } from './network-policy-conditional-selector';
import {
  isNetworkPolicyConversionError,
  NetworkPolicy,
  NetworkPolicyRule,
  networkPolicyToK8sResource,
} from './network-policy-model';
import { NetworkPolicyRuleConfigPanel } from './network-policy-rule-config';

const emptyRule = (): NetworkPolicyRule => {
  return {
    key: _.uniqueId(),
    peers: [],
    ports: [],
  };
};

type NetworkPolicyFormProps = {
  namespace: string;
};

export const NetworkPolicyForm: React.FunctionComponent<NetworkPolicyFormProps> = (props) => {
  const { t } = useTranslation();
  const { namespace } = props;

  const emptyPolicy: NetworkPolicy = {
    name: '',
    namespace,
    podSelector: [['', '']],
    ingress: {
      denyAll: false,
      rules: [],
    },
    egress: {
      denyAll: false,
      rules: [],
    },
  };

  const [networkPolicy, setNetworkPolicy] = React.useState(emptyPolicy);
  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showSDNAlert, setShowSDNAlert] = React.useState(true);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setNetworkPolicy({ ...networkPolicy, name: event.currentTarget.value });

  const handleMainPodSelectorChange = (updated: string[][]) => {
    setNetworkPolicy({ ...networkPolicy, podSelector: updated });
  };

  const handleDenyAllIngress: React.ReactEventHandler<HTMLInputElement> = (event) =>
    setNetworkPolicy({
      ...networkPolicy,
      ingress: { ...networkPolicy.ingress, denyAll: event.currentTarget.checked },
    });

  const handleDenyAllEgress: React.ReactEventHandler<HTMLInputElement> = (event) =>
    setNetworkPolicy({
      ...networkPolicy,
      egress: { ...networkPolicy.egress, denyAll: event.currentTarget.checked },
    });

  const updateIngressRules = (rules: NetworkPolicyRule[]) =>
    setNetworkPolicy({ ...networkPolicy, ingress: { ...networkPolicy.ingress, rules } });

  const updateEgressRules = (rules: NetworkPolicyRule[]) =>
    setNetworkPolicy({ ...networkPolicy, egress: { ...networkPolicy.egress, rules } });

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
          {t('public~Are you sure?')}
        </>
      ),
      message: msg,
      btnText: t('public~Remove all'),
      executeFn: () => {
        execute();
        return Promise.resolve();
      },
    });
  };

  const removeAllIngress = () => {
    removeAll(
      t(
        'public~This action will remove all rules within the Ingress section and cannot be undone.',
      ),
      () => updateIngressRules([]),
    );
  };

  const removeAllEgress = () => {
    removeAll(
      t('public~This action will remove all rules within the Egress section and cannot be undone.'),
      () => updateEgressRules([]),
    );
  };

  const removeIngressRule = (idx) => {
    updateIngressRules([
      ...networkPolicy.ingress.rules.slice(0, idx),
      ...networkPolicy.ingress.rules.slice(idx + 1),
    ]);
  };

  const removeEgressRule = (idx) => {
    updateEgressRules([
      ...networkPolicy.egress.rules.slice(0, idx),
      ...networkPolicy.egress.rules.slice(idx + 1),
    ]);
  };

  const save = (event) => {
    event.preventDefault();

    const policy = networkPolicyToK8sResource(networkPolicy);
    if (isNetworkPolicyConversionError(policy)) {
      setError(policy.error);
      return;
    }

    setInProgress(true);
    k8sCreate(NetworkPolicyModel, policy)
      .then(() => {
        setInProgress(false);
        history.push(
          resourcePathFromModel(NetworkPolicyModel, networkPolicy.name, networkPolicy.namespace),
        );
      })
      .catch((err) => {
        setError(err.message);
        setInProgress(false);
      });
  };

  return (
    <Form onSubmit={save} className="co-create-networkpolicy">
      <div className="form-group co-create-networkpolicy__name">
        <label className="co-required" htmlFor="name">
          {t('public~Policy name')}
        </label>
        <input
          className="pf-c-form-control"
          type="text"
          onChange={handleNameChange}
          value={networkPolicy.name}
          placeholder="my-policy"
          id="name"
          name="name"
          required
        />
      </div>
      <div className="form-group co-create-networkpolicy__podselector">
        <NetworkPolicyConditionalSelector
          selectorType="pod"
          helpText={t(
            'public~If no pod selector is provided, the policy will apply to all pods in the namespace.',
          )}
          values={networkPolicy.podSelector}
          onChange={handleMainPodSelectorChange}
        />
      </div>
      <div className="form-group co-create-networkpolicy__type">
        <Title headingLevel="h2">{t('public~Policy type')}</Title>
      </div>
      {showSDNAlert && (
        <Alert
          variant="info"
          title={t(
            'public~When using the OpenShift SDN cluster network provider, egress network policy is not supported.',
          )}
          actionClose={<AlertActionCloseButton onClose={() => setShowSDNAlert(false)} />}
        />
      )}
      <div className="form-group co-create-networkpolicy__deny">
        <label>{t('public~Select default ingress and egress deny rules')}</label>

        <div className="co-create-networkpolicy__deny-checkboxes">
          <div className="co-create-networkpolicy__deny-checkbox">
            <Checkbox
              label={t('public~Deny all ingress traffic')}
              onChange={handleDenyAllIngress}
              checked={networkPolicy.ingress.denyAll}
              name="denyAllIngress"
            />
          </div>
          <div className="co-create-networkpolicy__deny-checkbox">
            <Checkbox
              label={t('public~Deny all egress traffic')}
              onChange={handleDenyAllEgress}
              checked={networkPolicy.egress.denyAll}
              name="denyAllEgress"
            />
          </div>
        </div>
      </div>
      {!networkPolicy.ingress.denyAll && (
        <FormFieldGroupExpandable
          toggleAriaLabel="Ingress"
          className="co-create-networkpolicy__expandable-xl"
          isExpanded
          header={
            <FormFieldGroupHeader
              titleText={{ text: t('public~Ingress'), id: 'ingress-header' }}
              actions={
                <>
                  <Button
                    variant="link"
                    isDisabled={networkPolicy.ingress.rules.length === 0}
                    onClick={removeAllIngress}
                  >
                    {t('public~Remove all')}
                  </Button>
                  <Button variant="secondary" onClick={addIngressRule}>
                    {t('public~Add ingress rule')}
                  </Button>
                </>
              }
            />
          }
        >
          <div className="help-block" id="ingress-help">
            <p>
              {t(
                'public~List of ingress rules to be applied to the selected pods. Traffic is allowed from a source if it matches at least one rule.',
              )}
            </p>
          </div>
          {networkPolicy.ingress.rules.map((rule, idx) => (
            <NetworkPolicyRuleConfigPanel
              key={rule.key}
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
      {!networkPolicy.egress.denyAll && (
        <FormFieldGroupExpandable
          toggleAriaLabel="Egress"
          className="co-create-networkpolicy__expandable-xl"
          isExpanded
          header={
            <FormFieldGroupHeader
              titleText={{ text: t('public~Egress'), id: 'egress-header' }}
              actions={
                <>
                  <Button
                    variant="link"
                    isDisabled={networkPolicy.egress.rules.length === 0}
                    onClick={removeAllEgress}
                  >
                    {t('public~Remove all')}
                  </Button>
                  <Button variant="secondary" onClick={addEgressRule}>
                    {t('public~Add egress rule')}
                  </Button>
                </>
              }
            />
          }
        >
          <div className="help-block" id="egress-help">
            <p>
              {t(
                'public~List of egress rules to be applied to the selected pods. Traffic is allowed to a destination if it matches at least one rule.',
              )}
            </p>
          </div>
          {networkPolicy.egress.rules.map((rule, idx) => (
            <NetworkPolicyRuleConfigPanel
              key={rule.key}
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
        <ActionGroup className="pf-c-form">
          <Button type="submit" id="save-changes" variant="primary">
            {t('public~Create')}
          </Button>
          <Button onClick={history.goBack} id="cancel" variant="secondary">
            {t('public~Cancel')}
          </Button>
        </ActionGroup>
      </ButtonBar>
    </Form>
  );
};
