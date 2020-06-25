import * as React from 'react';
import * as _ from 'lodash';
import {
  Form,
  FormSelect,
  FormSelectOption,
  TextInput,
  Divider,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import { FirehoseResult } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { ModalBody } from '@console/internal/components/factory';
import { ValidationErrorType } from '@console/shared';
import { isLoaded } from '../../../../../../utils';
import { ModalFooter } from '../../../../modal/modal-footer';
import {
  AFFINITY_TYPE_LABLES,
  AFFINITY_CONDITIONS,
  AFFINITY_CONDITION_LABELS,
} from '../../../shared/consts';
import { FormRow } from '../../../../../form/form-row';
import { isWeightValid, isTermsInvalid, getTopologyKeyValidation } from '../../validations';
import { useIDEntities } from '../../../../../../hooks/use-id-entities';
import { NodeChecker } from '../../../shared/NodeChecker/node-checker';
import { useNodeQualifier } from '../../../shared/hooks';
import { AffinityLabel, AffinityRowData } from '../../types';
import { AffinityExpressionList } from '../affinity-expression-list/affinity-expression-list';
import './affinity-edit.scss';

export const AffinityEdit: React.FC<AffinityEditProps> = ({
  nodes,
  affinity,
  isDisabled,
  onAffinitySubmit,
  onCancel,
}) => {
  const [focusedAffinity, setFocusedAffinity] = React.useState(affinity);

  const [
    affinityExpressions,
    ,
    onExpressionAdd,
    onExpressionChange,
    onExpressionDelete,
    initialAffinityExpressionChanged,
  ] = useIDEntities<AffinityLabel>(affinity?.expressions);

  const onLabelExpressionAdd = () =>
    onExpressionAdd({ id: null, key: '', values: [], operator: 'In' } as AffinityLabel);

  const [
    affinityFields,
    ,
    onFieldAdd,
    onFieldChange,
    onFieldDelete,
    initialAffinityFieldChanged,
  ] = useIDEntities<AffinityLabel>(affinity?.fields);

  const initialAffinityChanged = initialAffinityFieldChanged || initialAffinityExpressionChanged;

  const onLabelFieldAdd = () =>
    onFieldAdd({ id: null, key: '', values: [], operator: 'In' } as AffinityLabel);

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

  const qualifiedExpressionNodes = useNodeQualifier(nodes, 'label', affinityExpressions);
  const qualifiedFieldNodes = useNodeQualifier(nodes, 'field', affinityFields);

  const getQualifiedNodes = () => {
    if (affinityExpressions.length > 0 && affinityFields.length > 0) {
      return _.intersection(qualifiedExpressionNodes, qualifiedFieldNodes);
    }
    if (affinityExpressions.length > 0) {
      return qualifiedExpressionNodes;
    }
    if (affinityFields.length > 0) {
      return qualifiedFieldNodes;
    }
    return [];
  };

  const isExpressionsInvalid = isTermsInvalid(affinityExpressions);
  const isFieldsInvalid = isTermsInvalid(affinityFields);
  const isWeightInvalid = !isWeightValid(focusedAffinity);

  const isAffinityInvalid =
    (affinityExpressions?.length === 0 && affinityFields?.length === 0) ||
    isWeightInvalid ||
    isExpressionsInvalid ||
    (isNodeAffinity && isFieldsInvalid) ||
    (!isNodeAffinity && isTopologyInvalid);

  return (
    <>
      <ModalBody>
        <div className="scheduling-modals__desc-container">
          <Text className="scheduling-modals__desc" component={TextVariants.small}>
            {
              'Define an affinity rule. This rule will be added to the list of affinity rules applied to this workload.'
            }
          </Text>
        </div>
        <Form>
          <FormRow title="Type" fieldId={'affinity-type'} isRequired>
            <FormSelect
              onChange={(value) =>
                setFocusedAffinity({
                  ...focusedAffinity,
                  type: value as AffinityRowData['type'],
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
                label={AFFINITY_CONDITION_LABELS[AFFINITY_CONDITIONS.required]}
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
          <Divider component="div" />
          <FormRow
            title={isNodeAffinity ? 'Node Labels' : 'Workload Labels'}
            fieldId={'expressions'}
            validationType={
              isExpressionsInvalid && initialAffinityChanged && ValidationErrorType.Error
            }
            validationMessage={
              isExpressionsInvalid && initialAffinityChanged && isNodeAffinity
                ? 'Missing fields in node labels'
                : 'Missing fields in workload labels'
            }
          >
            <div className="scheduling-modals__desc-container">
              {isNodeAffinity ? (
                <>
                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {'Select nodes that must have all the following expressions.'}
                  </Text>
                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {
                      'Label selectors let you select Nodes based on the value of one or more labels.'
                    }
                  </Text>
                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {'A list of matching nodes will be provided on label input below.'}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {'Select workloads that must have all the following expressions.'}
                  </Text>
                </>
              )}
            </div>
            <AffinityExpressionList
              expressions={affinityExpressions}
              addRowText="Add Expression"
              onAdd={onLabelExpressionAdd}
              onChange={onExpressionChange}
              onDelete={onExpressionDelete}
              rowID="affinity-expression"
            />
          </FormRow>
          {isNodeAffinity && (
            <>
              <Divider component="div" />
              <FormRow
                title="Node Fields"
                fieldId={'fields'}
                validationType={
                  isFieldsInvalid && initialAffinityChanged && ValidationErrorType.Error
                }
                validationMessage={
                  isFieldsInvalid && initialAffinityChanged && 'Missing fields in node fields'
                }
              >
                <div className="scheduling-modals__desc-container">
                  <>
                    <Text className="scheduling-modals__desc" component={TextVariants.small}>
                      {
                        'Field selectors let you select Nodes based on the value of one or more resource fields.'
                      }
                    </Text>
                    <Text className="scheduling-modals__desc" component={TextVariants.small}>
                      {
                        'Note that for Node field expressions, entering a full path is required in the Key field (e.g. `metadata.name: value`).'
                      }
                    </Text>
                    <Text className="scheduling-modals__desc" component={TextVariants.small}>
                      {'Some fields may not be supported.'}
                    </Text>
                  </>
                </div>
                <AffinityExpressionList
                  expressions={affinityFields}
                  addRowText="Add Field"
                  onAdd={onLabelFieldAdd}
                  onChange={onFieldChange}
                  onDelete={onFieldDelete}
                  rowID="affinity-field"
                />
              </FormRow>
              {(affinityExpressions.length > 0 || affinityFields.length > 0) &&
                !isAffinityInvalid && <NodeChecker qualifiedNodes={getQualifiedNodes()} />}
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
        submitButtonText="Save Affinity rule"
        isDisabled={isAffinityInvalid}
      />
    </>
  );
};

type AffinityEditProps = {
  nodes?: FirehoseResult<NodeKind[]>;
  affinity: AffinityRowData;
  isDisabled?: boolean;
  onAffinitySubmit: (affinity: AffinityRowData) => void;
  onCancel: (affinity: AffinityRowData) => void;
};
