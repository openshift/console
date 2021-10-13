import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { NetworkPolicyConditionalSelector } from './network-policy-conditional-selector';
import { NetworkPolicySelectorPreview } from './network-policy-selector-preview';

export const NetworkPolicyPeerSelectors: React.FunctionComponent<PeerSelectorProps> = (props) => {
  const { t } = useTranslation();
  const { policyNamespace, direction, onChange, podSelector, namespaceSelector } = props;

  const handlePodSelectorChange = (updated: string[][]) => {
    onChange(updated, namespaceSelector);
  };

  const handleNamespaceSelectorChange = (updated: string[][]) => {
    onChange(podSelector, updated);
  };
  const podsPreviewPopoverRef = React.useRef();
  let helpTextPodSelector;
  if (direction === 'ingress') {
    helpTextPodSelector = namespaceSelector
      ? t(
          'console-app~If no pod selector is provided, traffic from all pods in eligible namespaces will be allowed.',
        )
      : t(
          'console-app~If no pod selector is provided, traffic from all pods in this namespace will be allowed.',
        );
  } else {
    helpTextPodSelector = namespaceSelector
      ? t(
          'console-app~If no pod selector is provided, traffic to all pods in eligible namespaces will be allowed.',
        )
      : t(
          'console-app~If no pod selector is provided, traffic to all pods in this namespace will be allowed.',
        );
  }

  return (
    <>
      {namespaceSelector && (
        <div className="form-group co-create-networkpolicy__namespaceselector">
          <NetworkPolicyConditionalSelector
            selectorType="namespace"
            helpText={t(
              'console-app~If no namespace selector is provided, pods from all namespaces will be eligible.',
            )}
            values={namespaceSelector}
            onChange={handleNamespaceSelectorChange}
            dataTest="peer-namespace-selector"
          />
        </div>
      )}
      <div className="form-group co-create-networkpolicy__podselector">
        <NetworkPolicyConditionalSelector
          selectorType="pod"
          helpText={helpTextPodSelector}
          values={podSelector || []}
          onChange={handlePodSelectorChange}
          dataTest="peer-pod-selector"
        />
      </div>
      <p>
        <Trans ns="console-app">
          Show a preview of the{' '}
          <Button
            data-test={`show-affected-pods-${props.direction}}`}
            ref={podsPreviewPopoverRef}
            variant="link"
            isInline
          >
            affected pods
          </Button>{' '}
          that this {props.direction} rule will apply to
        </Trans>
      </p>
      <NetworkPolicySelectorPreview
        policyNamespace={policyNamespace}
        podSelector={podSelector}
        namespaceSelector={namespaceSelector}
        popoverRef={podsPreviewPopoverRef}
        dataTest={`pods-preview-${props.direction}`}
      />
    </>
  );
};

type PeerSelectorProps = {
  policyNamespace: string;
  podSelector: string[][];
  namespaceSelector?: string[][];
  direction: 'ingress' | 'egress';
  onChange: (podSelector: string[][], namespaceSelector?: string[][]) => void;
};
