import * as React from 'react';
import * as _ from 'lodash';
import { MinusCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { Button, Tooltip } from '@patternfly/react-core';
import {
  NodeAffinity as NodeAffinityType,
  MatchExpression,
  PodAffinity as PodAffinityType,
  PodAffinityTerm,
  Selector,
} from '@console/internal/module/k8s';
import { MatchExpressions } from './match-expressions';

enum AffinityRuleType {
  Preferred = 'Preferred',
  Required = 'Required',
}

const REQUIRED_TOOLTIP = 'Required rules must be met before a pod can be scheduled on a node.';
const PREFERRED_TOOLTIP =
  'Preferred rules specify that, if the rule is met, the scheduler tries to enforce the rules, but does not guarantee enforcement.';
const ALLOWED_MATCH_EXPRESSION_OPERATORS: MatchExpression['operator'][] = [
  'In',
  'NotIn',
  'Exists',
  'DoesNotExist',
];
const DEFAULT_MATCH_EXPRESSION: MatchExpression = {
  key: '',
  operator: 'Exists',
};

export const DEFAULT_NODE_AFFINITY: NodeAffinityType = {
  requiredDuringSchedulingIgnoredDuringExecution: {
    nodeSelectorTerms: [{ matchExpressions: [_.cloneDeep(DEFAULT_MATCH_EXPRESSION)] }],
  },
  preferredDuringSchedulingIgnoredDuringExecution: [
    {
      weight: 1,
      preference: { matchExpressions: [_.cloneDeep(DEFAULT_MATCH_EXPRESSION)] },
    },
  ],
};

export const DEFAULT_POD_AFFINITY: PodAffinityType = {
  requiredDuringSchedulingIgnoredDuringExecution: [
    {
      topologyKey: 'failure-domain.beta.kubernetes.io/zone',
      labelSelector: { matchExpressions: [_.cloneDeep(DEFAULT_MATCH_EXPRESSION)] },
    },
  ],
  preferredDuringSchedulingIgnoredDuringExecution: [
    {
      weight: 1,
      podAffinityTerm: {
        topologyKey: 'failure-domain.beta.kubernetes.io/zone',
        labelSelector: { matchExpressions: [_.cloneDeep(DEFAULT_MATCH_EXPRESSION)] },
      },
    },
  ],
};

const NodeAffinityRule: React.FC<NodeAffinityRuleProps> = ({
  key,
  type,
  showRemoveButton = false,
  onClickRemove,
  onChange = () => {},
  rule,
}) => {
  const { weight, selector } = rule;
  const onChangeMatchExpressions = (matchExpressions: MatchExpression[]): void =>
    onChange({
      ...rule,
      selector: {
        ...selector,
        matchExpressions,
      },
    });

  const onChangeWeight = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const parsedValue = _.parseInt(e?.target?.value);
    onChange({
      ...rule,
      weight: _.isFinite(parsedValue) ? parsedValue : undefined,
    });
  };

  return (
    <div className="co-affinity-term">
      {showRemoveButton && (
        <Button
          type="button"
          className="co-affinity-term__remove"
          onClick={onClickRemove}
          variant="link"
        >
          <MinusCircleIcon className="co-icon-space-r" />
          Remove {type}
        </Button>
      )}
      {type === AffinityRuleType.Preferred && (
        <div className="co-affinity-term__weight-input">
          <label className="control-label co-required" htmlFor={`preference-${key}`}>
            Weight
          </label>
          <input
            className="pf-c-form-control"
            type="number"
            value={weight}
            onChange={onChangeWeight}
            required
          />
        </div>
      )}
      <MatchExpressions
        matchExpressions={selector?.matchExpressions}
        onChange={onChangeMatchExpressions}
        allowedOperators={ALLOWED_MATCH_EXPRESSION_OPERATORS}
        uid={key}
      />
    </div>
  );
};

export const NodeAffinity: React.FC<NodeAffinityProps> = ({ affinity, onChange, uid = '' }) => {
  const requiredRules =
    affinity?.requiredDuringSchedulingIgnoredDuringExecution?.nodeSelectorTerms || [];
  const preferredRules = affinity?.preferredDuringSchedulingIgnoredDuringExecution || [];
  const addRequiredRule = () =>
    onChange?.({
      ...affinity,
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [...requiredRules, { matchExpressions: [] }],
      },
    });

  const removeRequiredRule = (atIndex: number) =>
    onChange?.({
      ...affinity,
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: requiredRules.filter((_v, index) => index !== atIndex),
      },
    });

  const updateRequiredRules = ({ selector }: NodeAffinityRule, atIndex: number) =>
    onChange?.({
      ...affinity,
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: requiredRules.map((current, index) =>
          index === atIndex ? selector : current,
        ),
      },
    });

  const addPreferredRule = () =>
    onChange?.({
      ...affinity,
      preferredDuringSchedulingIgnoredDuringExecution: [
        ...preferredRules,
        { weight: 1, preference: { matchExpressions: [] } },
      ],
    });

  const removePreferredRule = (atIndex: number) =>
    onChange?.({
      ...affinity,
      preferredDuringSchedulingIgnoredDuringExecution: preferredRules.filter(
        (_v, index) => index !== atIndex,
      ),
    });

  const updatePreferredRules = (
    { selector: preference, weight }: NodeAffinityRule,
    atIndex: number,
  ) =>
    onChange?.({
      ...affinity,
      preferredDuringSchedulingIgnoredDuringExecution: preferredRules.map((current, index) =>
        index === atIndex ? { preference, weight } : current,
      ),
    });

  return (
    <dl>
      <Tooltip content={REQUIRED_TOOLTIP}>
        <dt>Required During Scheduling Ignored During Execution</dt>
      </Tooltip>
      <dd>
        {requiredRules.map((selector, requiredIndex) => (
          <NodeAffinityRule
            // Have to use array index in the key bc any other unique id whould have to use editable fields.
            // eslint-disable-next-line react/no-array-index-key
            key={`${uid}-node-affinity-required-${requiredIndex}`}
            onChange={(rule) => updateRequiredRules(rule, requiredIndex)}
            onClickRemove={() => removeRequiredRule(requiredIndex)}
            rule={{ selector }}
            showRemoveButton
            type={AffinityRuleType.Required}
          />
        ))}
        <div className="row">
          <Button type="button" onClick={addRequiredRule} variant="link">
            <PlusCircleIcon className="co-icon-space-r" />
            Add Required
          </Button>
        </div>
      </dd>
      <Tooltip content={PREFERRED_TOOLTIP}>
        <dt>Preferred During Scheduling Ignored During Execution</dt>
      </Tooltip>
      <dd>
        {preferredRules.map(({ preference: selector, weight }, preferredIndex) => (
          <NodeAffinityRule
            // Have to use array index in the key bc any other unique id whould have to use editable fields.
            // eslint-disable-next-line react/no-array-index-key
            key={`${uid}-node-affinity-preferred-${preferredIndex}`}
            onChange={(rule) => updatePreferredRules(rule, preferredIndex)}
            onClickRemove={() => removePreferredRule(preferredIndex)}
            rule={{ selector, weight }}
            showRemoveButton
            type={AffinityRuleType.Preferred}
          />
        ))}
        <div className="row">
          <Button type="button" onClick={addPreferredRule} variant="link">
            <PlusCircleIcon className="co-icon-space-r" />
            Add Preferred
          </Button>
        </div>
      </dd>
    </dl>
  );
};

const PodAffinityRule: React.FC<PodAffinityRuleProps> = ({
  key,
  onChange = () => {},
  onClickRemove = () => {},
  showRemoveButton = false,
  rule,
  type,
}) => {
  const { podAffinityTerm, weight } = rule;
  const selector = podAffinityTerm?.labelSelector || {};
  const topologyKey = podAffinityTerm?.topologyKey;
  const onChangeWeight = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const parsed = _.parseInt(e?.target?.value);
    onChange({
      ...rule,
      weight: _.isFinite(parsed) ? parsed : undefined,
    });
  };

  const onChangeTopologyKey = (e: React.ChangeEvent<HTMLInputElement>): void =>
    onChange({
      ...rule,
      podAffinityTerm: {
        ...podAffinityTerm,
        topologyKey: e?.target?.value,
      },
    });
  const onChangeMatchExpressions = (matchExpressions: MatchExpression[]): void =>
    onChange({
      ...rule,
      podAffinityTerm: {
        ...podAffinityTerm,
        labelSelector: {
          ...selector,
          matchExpressions,
        },
      },
    });

  return podAffinityTerm ? (
    <div className="co-affinity-term">
      {showRemoveButton && (
        <Button
          type="button"
          className="co-affinity-term__remove"
          onClick={onClickRemove}
          variant="link"
        >
          <MinusCircleIcon className="co-icon-space-r" />
          Remove {type}
        </Button>
      )}
      <div className="co-affinity-term__topology">
        {type === AffinityRuleType.Preferred && (
          <div className="co-affinity-term__weight-input">
            <label className="control-label co-required" htmlFor={`preference-${key}`}>
              Weight
            </label>
            <input
              className="pf-c-form-control"
              type="number"
              value={weight}
              onChange={onChangeWeight}
              required
            />
          </div>
        )}
        <div className="co-affinity-term__topology-input">
          <label className="control-label co-required" htmlFor={`topology-${key}`}>
            Topology Key
          </label>
          <input
            id={`topology-${key}`}
            className="pf-c-form-control"
            type="text"
            value={topologyKey}
            onChange={onChangeTopologyKey}
            required
          />
        </div>
      </div>
      <MatchExpressions
        matchExpressions={selector?.matchExpressions}
        onChange={onChangeMatchExpressions}
        allowedOperators={ALLOWED_MATCH_EXPRESSION_OPERATORS}
        uid={key}
      />
    </div>
  ) : null;
};

export const PodAffinity: React.FC<PodAffinityProps> = ({ affinity, onChange, uid = '' }) => {
  const {
    requiredDuringSchedulingIgnoredDuringExecution: requiredRules = [],
    preferredDuringSchedulingIgnoredDuringExecution: preferredRules = [],
  } = affinity || {};

  const addRequiredRule = () =>
    onChange?.({
      ...affinity,
      requiredDuringSchedulingIgnoredDuringExecution: [
        ...requiredRules,
        { topologyKey: '', labelSelector: { matchExpressions: [] } },
      ],
    });

  const removeRequiredRule = (atIndex: number) =>
    onChange?.({
      ...affinity,
      requiredDuringSchedulingIgnoredDuringExecution: requiredRules.filter(
        (_v, index) => atIndex !== index,
      ),
    });

  const updateRequiredRules = ({ podAffinityTerm: next }: PodAffinityRule, atIndex: number) =>
    onChange?.({
      ...affinity,
      requiredDuringSchedulingIgnoredDuringExecution: requiredRules.map((current, index) =>
        index === atIndex ? next : current,
      ),
    });

  const addPreferredRule = () =>
    onChange?.({
      ...affinity,
      preferredDuringSchedulingIgnoredDuringExecution: [
        ...preferredRules,
        {
          weight: 1,
          podAffinityTerm: { topologyKey: '', labelSelector: { matchExpressions: [] } },
        },
      ],
    });

  const removePreferredRule = (atIndex: number) =>
    onChange?.({
      ...affinity,
      preferredDuringSchedulingIgnoredDuringExecution: preferredRules.filter(
        (_v, index) => atIndex !== index,
      ),
    });

  const updatePreferredRules = (next: PodAffinityRule, atIndex: number) =>
    onChange?.({
      ...affinity,
      preferredDuringSchedulingIgnoredDuringExecution: preferredRules.map((current, index) =>
        index === atIndex ? next : current,
      ),
    });

  return (
    <dl>
      <Tooltip content={REQUIRED_TOOLTIP}>
        <dt>Required During Scheduling Ignored During Execution</dt>
      </Tooltip>
      <dd>
        {_.map(requiredRules, (podAffinityTerm, ruleIndex) => (
          // Have to use array index in the key bc any other unique id whould have to use editable fields.
          // eslint-disable-next-line react/no-array-index-key
          <PodAffinityRule
            key={`${uid}-pod-affinity-required-${ruleIndex}`}
            rule={{ podAffinityTerm }}
            onChange={(rule) => updateRequiredRules(rule, ruleIndex)}
            onClickRemove={() => removeRequiredRule(ruleIndex)}
            showRemoveButton
            type={AffinityRuleType.Required}
          />
        ))}
        <div className="row">
          <Button type="button" onClick={addRequiredRule} variant="link">
            <PlusCircleIcon className="co-icon-space-r" />
            Add Required
          </Button>
        </div>
      </dd>
      <Tooltip content={PREFERRED_TOOLTIP}>
        <dt>Preferred During Scheduling Ignored During Execution</dt>
      </Tooltip>
      <dd>
        {preferredRules.map((preferredRule, ruleIndex) => {
          // Have to use array index in the key bc any other unique id whould have to use editable fields.
          return (
            <PodAffinityRule
              // eslint-disable-next-line react/no-array-index-key
              key={`${uid}-pod-affinity-preferred-${ruleIndex}`}
              onChange={(rule) => updatePreferredRules(rule, ruleIndex)}
              onClickRemove={() => removePreferredRule(ruleIndex)}
              showRemoveButton
              rule={preferredRule}
              type={AffinityRuleType.Preferred}
            />
          );
        })}

        <div className="row">
          <Button type="button" onClick={addPreferredRule} variant="link">
            <PlusCircleIcon className="co-icon-space-r" />
            Add Preferred
          </Button>
        </div>
      </dd>
    </dl>
  );
};

type NodeAffinityRule = {
  selector: Selector;
  weight?: number;
};

export type NodeAffinityRuleProps = {
  key: string;
  onChange?: (rule: NodeAffinityRule) => void;
  onClickRemove?: () => void;
  rule: NodeAffinityRule;
  showRemoveButton?: boolean;
  type: AffinityRuleType;
};

export type NodeAffinityProps = {
  uid?: string;
  affinity: NodeAffinityType;
  onChange: (affinity: NodeAffinityType) => void;
};

type PodAffinityRule = {
  podAffinityTerm: PodAffinityTerm;
  weight?: number;
};

export type PodAffinityRuleProps = {
  key: string;
  rule: PodAffinityRule;
  onChange?: (rule: PodAffinityRule) => void;
  onClickRemove?: () => void;
  showRemoveButton?: boolean;
  type: AffinityRuleType;
};

export type PodAffinityProps = {
  uid?: string;
  affinity: PodAffinityType;
  onChange: (affinity: PodAffinityType) => void;
};

NodeAffinity.displayName = 'NodeAffinity';
PodAffinity.displayName = 'PodAffinity';
