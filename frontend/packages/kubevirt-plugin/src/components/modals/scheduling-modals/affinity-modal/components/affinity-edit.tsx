import * as React from 'react';
import { Form, FormSelect, FormSelectOption, TextInput, Divider } from '@patternfly/react-core';
import { FirehoseResult } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ModalBody } from '@console/internal/components/factory';
import { ValidationErrorType } from '@console/shared';
import { isLoaded } from '../../../../../utils';
import { ModalFooter } from '../../../modal/modal-footer';
import {
  AFFINITY_TYPE_LABLES,
  AFFINITY_CONDITIONS,
  AFFINITY_CONDITION_LABELS,
} from '../../shared/consts';
import { FormRow } from '../../../../form/form-row';
import {
  isWeightValid,
  isRequiredConditionDisabled,
  isTermsInvalid,
  getTopologyKeyValidation,
} from '../validations';
import { useIDEntities } from '../../../../../hooks/use-id-entities';
import { NodeChecker } from '../../shared/NodeChecker/node-checker';
import { useNodeQualifier } from '../../shared/hooks';
import { AffinityLabel, AffinityRowData } from '../types';
import { AffinityExpressionList } from './affinity-expression-list/affinity-expression-list';

export const AffinityEdit: React.FC<AffinityEditProps> = ({
  nodes,
  affinity,
  affinities,
  isDisabled,
  onAffinitySubmit,
  onCancel,
}) => {
  const [focusedAffinity, setFocusedAffinity] = React.useState(affinity);

  const expressionsWithID = affinity?.expressions?.map((exp, i) => ({ ...exp, id: i }));
  const [
    affinityExpressions,
    ,
    onExpressionAdd,
    onExpressionChange,
    onExpressionDelete,
  ] = useIDEntities<AffinityLabel>(expressionsWithID);

  const onLabelExpressionAdd = () =>
    onExpressionAdd({ id: null, key: '', values: [], operator: 'In' } as AffinityLabel);

  const fieldsWithID = affinity?.fields?.map((field, i) => ({ ...field, id: i }));
  const [affinityFields, , onFieldAdd, onFieldChange, onFieldDelete] = useIDEntities<AffinityLabel>(
    fieldsWithID,
  );

  const onLabelFieldAdd = () =>
    onFieldAdd({ id: null, key: '', values: [], operator: 'In' } as AffinityLabel);

  const isRequiredDisabled = isRequiredConditionDisabled(focusedAffinity, affinities);
  const isNodeAffinity = focusedAffinity.type === 'nodeAffinity';
  const {
    isTopologyDisabled,
    isTopologyInvalid,
    topologyValidationMessage,
  } = getTopologyKeyValidation(focusedAffinity);

  React.useEffect(() => {
    if (isTopologyDisabled && focusedAffinity.topologyKey !== 'kubernetes.io/hostname')
      setFocusedAffinity({ ...focusedAffinity, topologyKey: 'kubernetes.io/hostname' });
  }, [focusedAffinity, isTopologyDisabled]);

  const qualifiedNodes = useNodeQualifier(nodes, affinityExpressions, affinityFields);

  const isExpressionsInvalid = isTermsInvalid(affinityExpressions);
  const isFieldsInvalid = isTermsInvalid(affinityFields);
  const isWeightInvalid = !isWeightValid(focusedAffinity);

  const isAffinityInvalid =
    (affinityExpressions.length === 0 && affinityFields.length === 0) ||
    isWeightInvalid ||
    isExpressionsInvalid ||
    (isNodeAffinity && isFieldsInvalid) ||
    (!isNodeAffinity && isTopologyInvalid);

  return (
    <>
      <ModalBody>
        <Form>
          <FormRow title="Type" fieldId={'affinity-type'} isRequired>
            <FormSelect
              onChange={(value) =>
                setFocusedAffinity({
                  ...focusedAffinity,
                  type: value as AffinityRowData['type'],
                  condition:
                    value === 'nodeAffinity'
                      ? AFFINITY_CONDITIONS.preferred
                      : focusedAffinity.condition,
                })
              }
              value={focusedAffinity.type}
              id={'affinity-type'}
              isDisabled={isDisabled}
            >
              {Object.keys(AFFINITY_TYPE_LABLES).map((affinityType) => {
                return (
                  <FormSelectOption
                    key={affinityType}
                    value={affinityType}
                    label={AFFINITY_TYPE_LABLES[affinityType]}
                  />
                );
              })}
            </FormSelect>
          </FormRow>
          <FormRow title="Condition" fieldId={'affinity-condition'} isRequired>
            <FormSelect
              onChange={(value) =>
                setFocusedAffinity({
                  ...focusedAffinity,
                  condition: value as AffinityRowData['condition'],
                })
              }
              value={focusedAffinity.condition}
              id={'affinity-condition'}
              isDisabled={isDisabled}
            >
              <FormSelectOption
                key={AFFINITY_CONDITIONS.preferred}
                value={AFFINITY_CONDITIONS.preferred}
                label={AFFINITY_CONDITION_LABELS[AFFINITY_CONDITIONS.preferred]}
              />
              <FormSelectOption
                key={AFFINITY_CONDITIONS.required}
                value={AFFINITY_CONDITIONS.required}
                label={
                  !isRequiredDisabled
                    ? AFFINITY_CONDITION_LABELS[AFFINITY_CONDITIONS.required]
                    : `${
                        AFFINITY_CONDITION_LABELS[AFFINITY_CONDITIONS.required]
                      } - Affinity already in use`
                }
                isDisabled={isDisabled || isRequiredDisabled}
              />
            </FormSelect>
          </FormRow>
          {focusedAffinity?.condition === AFFINITY_CONDITIONS.preferred && (
            <FormRow
              title="Weight"
              fieldId={'weight'}
              validationType={
                isWeightInvalid ? ValidationErrorType.Error : ValidationErrorType.Info
              }
              validationMessage="Weight must be a number between 1-100"
              isRequired
            >
              <TextInput
                key="weight"
                isDisabled={isDisabled}
                id={'weight'}
                value={focusedAffinity.weight || ''}
                onChange={(value) =>
                  setFocusedAffinity({ ...focusedAffinity, weight: parseInt(value, 10) })
                }
              />
            </FormRow>
          )}
          {!isNodeAffinity && (
            <FormRow
              title="Topology Key"
              fieldId={'topology-key'}
              validationType={
                isTopologyInvalid ? ValidationErrorType.Error : ValidationErrorType.Info
              }
              validationMessage={topologyValidationMessage}
            >
              <TextInput
                key="topology-key"
                isDisabled={isDisabled || isTopologyDisabled}
                id={'topology-key'}
                value={focusedAffinity.topologyKey || ''}
                onChange={(value) => setFocusedAffinity({ ...focusedAffinity, topologyKey: value })}
              />
            </FormRow>
          )}
          <Divider />
          <FormRow
            title="Expressions"
            fieldId={'expressions'}
            validationType={isExpressionsInvalid && ValidationErrorType.Error}
            validationMessage={isExpressionsInvalid && 'Missing fields'}
          >
            <AffinityExpressionList
              expressions={affinityExpressions}
              addRowText="Add Expression"
              onAdd={onLabelExpressionAdd}
              onChange={onExpressionChange}
              onDelete={onExpressionDelete}
            />
          </FormRow>
          {isNodeAffinity && (
            <>
              <Divider />
              <FormRow
                title="Node Fields"
                fieldId={'fields'}
                validationType={isFieldsInvalid && ValidationErrorType.Error}
                validationMessage={isFieldsInvalid && 'Missing fields'}
              >
                <AffinityExpressionList
                  expressions={affinityFields}
                  addRowText="Add Field"
                  onAdd={onLabelFieldAdd}
                  onChange={onFieldChange}
                  onDelete={onFieldDelete}
                />
              </FormRow>
              <NodeChecker qualifiedNodes={qualifiedNodes} />
            </>
          )}
        </Form>
      </ModalBody>
      <ModalFooter
        id="affinity-edit"
        className="kubevirt-affinity-edit__footer"
        inProgress={!isLoaded(nodes)}
        onSubmit={() =>
          onAffinitySubmit({
            ...focusedAffinity,
            expressions: affinityExpressions,
            fields: affinityFields,
          })
        }
        onCancel={onCancel}
        submitButtonText="Save Affinity"
        isDisabled={isAffinityInvalid}
      />
    </>
  );
};

type AffinityEditProps = {
  nodes?: FirehoseResult<K8sResourceKind[]>;
  affinity: AffinityRowData;
  affinities: AffinityRowData[];
  isDisabled?: boolean;
  onAffinitySubmit: (affinity: AffinityRowData) => void;
  onCancel: (affinity: AffinityRowData) => void;
};
