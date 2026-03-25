import type { FC, ChangeEvent } from 'react';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Tooltip,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type {
  NodeAffinity as NodeAffinityType,
  MatchExpression,
  PodAffinity as PodAffinityType,
  PodAffinityTerm,
  Selector,
} from '@console/internal/module/k8s';
import { MatchExpressions } from './match-expressions';

import './affinity.scss';

enum AffinityRuleType {
  Preferred = 'Preferred',
  Required = 'Required',
}

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

const NodeAffinityRule: FC<NodeAffinityRuleProps> = ({
  key,
  type,
  showRemoveButton = false,
  onClickRemove,
  onChange = () => {},
  rule,
}) => {
  const { t } = useTranslation();
  const { weight, selector } = rule;
  const onChangeMatchExpressions = (matchExpressions: MatchExpression[]): void =>
    onChange({
      ...rule,
      selector: {
        ...selector,
        matchExpressions,
      },
    });

  const onChangeWeight = (e: ChangeEvent<HTMLInputElement>): void => {
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
          icon={<MinusCircleIcon className="co-icon-space-r" />}
          type="button"
          className="co-affinity-term__remove"
          onClick={onClickRemove}
          variant="link"
        >
          {t('olm~Remove {{item}}', { item: type })}
        </Button>
      )}
      {type === AffinityRuleType.Preferred && (
        <div className="co-affinity-term__weight-input">
          <label className="co-required" htmlFor={`preference-${key}`}>
            {t('olm~Weight')}
          </label>
          <span className="pf-v6-c-form-control">
            <input type="number" value={weight} onChange={onChangeWeight} required />
          </span>
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

export const NodeAffinity: FC<NodeAffinityProps> = ({ affinity, onChange, uid = '' }) => {
  const { t } = useTranslation();
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
    <DescriptionList>
      <DescriptionListGroup>
        <Tooltip
          content={t('olm~Required rules must be met before a pod can be scheduled on a node.')}
        >
          <DescriptionListTerm>
            {t('olm~Required during scheduling, ignored during execution')}
          </DescriptionListTerm>
        </Tooltip>
        <DescriptionListDescription>
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
          <div>
            <Button
              icon={<PlusCircleIcon className="co-icon-space-r" />}
              type="button"
              onClick={addRequiredRule}
              variant="link"
            >
              {t('olm~Add required')}
            </Button>
          </div>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <Tooltip
          content={t(
            'olm~Preferred rules specify that, if the rule is met, the scheduler tries to enforce the rules, but does not guarantee enforcement.',
          )}
        >
          <DescriptionListTerm>
            {t('olm~Preferred during scheduling, ignored during execution')}
          </DescriptionListTerm>
        </Tooltip>
        <DescriptionListDescription>
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
          <div>
            <Button
              icon={<PlusCircleIcon className="co-icon-space-r" />}
              type="button"
              onClick={addPreferredRule}
              variant="link"
            >
              {t('olm~Add preferred')}
            </Button>
          </div>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

const PodAffinityRule: FC<PodAffinityRuleProps> = ({
  key,
  onChange = () => {},
  onClickRemove = () => {},
  showRemoveButton = false,
  rule,
  type,
}) => {
  const { t } = useTranslation();
  const { podAffinityTerm, weight } = rule;
  const selector = podAffinityTerm?.labelSelector || {};
  const topologyKey = podAffinityTerm?.topologyKey;
  const onChangeWeight = (e: ChangeEvent<HTMLInputElement>): void => {
    const parsed = _.parseInt(e?.target?.value);
    onChange({
      ...rule,
      weight: _.isFinite(parsed) ? parsed : undefined,
    });
  };

  const onChangeTopologyKey = (e: ChangeEvent<HTMLInputElement>): void =>
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
          icon={<MinusCircleIcon className="co-icon-space-r" />}
          type="button"
          className="co-affinity-term__remove"
          onClick={onClickRemove}
          variant="link"
        >
          {t('olm~Remove {{item}}', { item: type })}
        </Button>
      )}
      <div className="co-affinity-term__topology">
        {type === AffinityRuleType.Preferred && (
          <div className="co-affinity-term__weight-input">
            <label className="co-required" htmlFor={`preference-${key}`}>
              {t('olm~Weight')}
            </label>
            <span className="pf-v6-c-form-control">
              <input type="number" value={weight} onChange={onChangeWeight} required />
            </span>
          </div>
        )}
        <div className="co-affinity-term__topology-input">
          <label className="co-required" htmlFor={`topology-${key}`}>
            {t('olm~Topology key')}
          </label>
          <span className="pf-v6-c-form-control">
            <input
              id={`topology-${key}`}
              type="text"
              value={topologyKey}
              onChange={onChangeTopologyKey}
              required
            />
          </span>
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

export const PodAffinity: FC<PodAffinityProps> = ({ affinity, onChange, uid = '' }) => {
  const {
    requiredDuringSchedulingIgnoredDuringExecution: requiredRules = [],
    preferredDuringSchedulingIgnoredDuringExecution: preferredRules = [],
  } = affinity || {};
  const { t } = useTranslation();
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
    <DescriptionList>
      <DescriptionListGroup>
        <Tooltip
          content={t('olm~Required rules must be met before a pod can be scheduled on a node.')}
        >
          <DescriptionListTerm>
            {t('olm~Required during scheduling, ignored during execution')}
          </DescriptionListTerm>
        </Tooltip>
        <DescriptionListDescription>
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
          <div>
            <Button
              icon={<PlusCircleIcon className="co-icon-space-r" />}
              type="button"
              onClick={addRequiredRule}
              variant="link"
            >
              {t('olm~Add required')}
            </Button>
          </div>
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <Tooltip
          content={t(
            'olm~Preferred rules specify that, if the rule is met, the scheduler tries to enforce the rules, but does not guarantee enforcement.',
          )}
        >
          <DescriptionListTerm>
            {t('olm~Preferred during scheduling, ignored during execution')}
          </DescriptionListTerm>
        </Tooltip>
        <DescriptionListDescription>
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

          <div>
            <Button
              icon={<PlusCircleIcon className="co-icon-space-r" />}
              type="button"
              onClick={addPreferredRule}
              variant="link"
            >
              {t('olm~Add preferred')}
            </Button>
          </div>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
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
