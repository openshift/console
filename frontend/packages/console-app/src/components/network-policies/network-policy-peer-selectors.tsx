import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NetworkPolicyConditionalSelector } from './network-policy-conditional-selector';

export const NetworkPolicyPeerSelectors: React.FunctionComponent<PeerSelectorProps> = (props) => {
  const { t } = useTranslation();
  const { direction, onChange, podSelector, namespaceSelector } = props;

  const handlePodSelectorChange = (updated: string[][]) => {
    onChange(updated, namespaceSelector);
  };

  const handleNamespaceSelectorChange = (updated: string[][]) => {
    onChange(podSelector, updated);
  };

  let helpTextPodSelector;
  if (direction === 'ingress') {
    helpTextPodSelector = namespaceSelector
      ? t(
          'public~If no pod selector is provided, traffic from all pods in elligible namespaces will be allowed.',
        )
      : t(
          'public~If no pod selector is provided, traffic from all pods in this namespace will be allowed.',
        );
  } else {
    helpTextPodSelector = namespaceSelector
      ? t(
          'public~If no pod selector is provided, traffic to all pods in elligible namespaces will be allowed.',
        )
      : t(
          'public~If no pod selector is provided, traffic to all pods in this namespace will be allowed.',
        );
  }

  return (
    <>
      {namespaceSelector && (
        <div className="form-group co-create-networkpolicy__namespaceselector">
          <NetworkPolicyConditionalSelector
            selectorType="namespace"
            helpText={t(
              'public~If no namespace selector is provided, pods from all namespaces will be elligible.',
            )}
            values={namespaceSelector}
            onChange={handleNamespaceSelectorChange}
          />
        </div>
      )}
      <div className="form-group co-create-networkpolicy__podselector">
        <NetworkPolicyConditionalSelector
          selectorType="pod"
          helpText={helpTextPodSelector}
          values={podSelector}
          onChange={handlePodSelectorChange}
        />
      </div>
    </>
  );
};

type PeerSelectorProps = {
  podSelector: string[][];
  namespaceSelector?: string[][];
  direction: 'ingress' | 'egress';
  onChange: (podSelector: string[][], namespaceSelector?: string[][]) => void;
};
