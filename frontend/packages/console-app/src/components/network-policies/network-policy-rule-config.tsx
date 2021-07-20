import * as React from 'react';
import {
  Button,
  CardBody,
  CardTitle,
  Card,
  Divider,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
} from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  NetworkPolicyAddPeerDropdown,
  NetworkPolicyPeerType,
} from './network-policy-add-peer-dropdown';
import { NetworkPolicyPeer, NetworkPolicyRule } from './network-policy-model';
import { NetworkPolicyPeerIPBlock } from './network-policy-peer-ipblock';
import { NetworkPolicyPeerSelectors } from './network-policy-peer-selectors';
import { NetworkPolicyPorts } from './network-policy-ports';

const getPeerRuleTitle = (t, direction: 'ingress' | 'egress', peer: NetworkPolicyPeer) => {
  if (peer.ipBlock) {
    return direction === 'ingress'
      ? t('public~Allow traffic from peers by IP block')
      : t('public~Allow traffic to peers by IP block');
  }
  if (peer.namespaceSelector) {
    return direction === 'ingress'
      ? t('public~Allow traffic from pods inside the cluster')
      : t('public~Allow traffic to pods inside the cluster');
  }
  return direction === 'ingress'
    ? t('public~Allow traffic from pods in the same namespace')
    : t('public~Allow traffic to pods in the same namespace');
};

const emptyPeer = (type: NetworkPolicyPeerType): NetworkPolicyPeer => {
  const key = _.uniqueId();
  switch (type) {
    case 'sameNS':
      return {
        key,
        podSelector: [],
      };
    case 'anyNS':
      return {
        key,
        podSelector: [],
        namespaceSelector: [],
      };
    case 'ipBlock':
    default:
      return {
        key,
        ipBlock: { cidr: '', except: [] },
      };
  }
};

export const NetworkPolicyRuleConfigPanel: React.FunctionComponent<RuleConfigProps> = (props) => {
  const { t } = useTranslation();
  const { direction, onChange, onRemove, rule } = props;
  const peersHelp =
    direction === 'ingress'
      ? t(
          'public~Sources added to this rule will allow traffic to the pods defined above. Sources in this list are combined using a logical OR operation.',
        )
      : t(
          'public~Destinations added to this rule will allow traffic from the pods defined above. Destinations in this list are combined using a logical OR operation.',
        );

  const addPeer = (type: NetworkPolicyPeerType) => {
    rule.peers = [emptyPeer(type), ...rule.peers];
    onChange(rule);
  };

  const removePeer = (idx) => {
    rule.peers = [...rule.peers.slice(0, idx), ...rule.peers.slice(idx + 1)];
    onChange(rule);
  };

  return (
    <Card>
      <CardTitle component="h4">
        <div className="co-create-networkpolicy__rule-header">
          <label>
            {direction === 'ingress' ? t('public~Ingress rule') : t('public~Egress rule')}
          </label>
          <div className="co-create-networkpolicy__rule-header-right">
            <Button variant="link" onClick={onRemove}>
              {t('public~Remove')}
            </Button>
          </div>
          <NetworkPolicyAddPeerDropdown
            title={
              direction === 'ingress'
                ? t('public~Add allowed source')
                : t('public~Add allowed destination')
            }
            onSelect={addPeer}
          />
        </div>
      </CardTitle>
      <CardBody>
        <div className="help-block" id="ingress-peers-help">
          <p>{peersHelp}</p>
        </div>
      </CardBody>
      <CardBody>
        {rule.peers.map((peer, idx) => {
          const peerPanel = peer.ipBlock ? (
            <NetworkPolicyPeerIPBlock
              direction={direction}
              ipBlock={peer.ipBlock}
              onChange={(ipBlock) => {
                rule.peers[idx].ipBlock = ipBlock;
                onChange(rule);
              }}
            />
          ) : (
            <NetworkPolicyPeerSelectors
              direction={direction}
              namespaceSelector={peer.namespaceSelector}
              podSelector={peer.podSelector}
              onChange={(podSel, nsSel) => {
                rule.peers[idx].podSelector = podSel;
                rule.peers[idx].namespaceSelector = nsSel;
                onChange(rule);
              }}
            />
          );
          return (
            <div className="form-group" key={peer.key}>
              <FormFieldGroupExpandable
                toggleAriaLabel="Peer"
                isExpanded
                header={
                  <FormFieldGroupHeader
                    titleText={{
                      text: getPeerRuleTitle(t, direction, peer),
                      id: `peer-header-${idx}`,
                    }}
                    actions={
                      <Button
                        aria-label={t('public~Remove peer')}
                        className="co-create-networkpolicy__remove-peer"
                        onClick={() => removePeer(idx)}
                        type="button"
                        variant="plain"
                      >
                        <TrashIcon />
                      </Button>
                    }
                  />
                }
              >
                {peerPanel}
              </FormFieldGroupExpandable>
              <Divider />
            </div>
          );
        })}
        <NetworkPolicyPorts
          direction={direction}
          ports={rule.ports}
          onChange={(ports) => {
            rule.ports = ports;
            onChange(rule);
          }}
        />
      </CardBody>
    </Card>
  );
};

type RuleConfigProps = {
  direction: 'ingress' | 'egress';
  rule: NetworkPolicyRule;
  onChange: (rule: NetworkPolicyRule) => void;
  onRemove: () => void;
};
