import * as React from 'react';
import {
  Divider,
  Form,
  FormSelect,
  FormSelectOption,
  Text,
  TextInput,
  TextVariants,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ModalBody } from '@console/internal/components/factory';
import { FirehoseResult } from '@console/internal/components/utils';
import { NodeKind } from '@console/internal/module/k8s';
import { ValidationErrorType } from '@console/shared';
import { useIDEntities } from '../../../../../../hooks/use-id-entities';
import { isLoaded } from '../../../../../../utils';
import { FormRow } from '../../../../../form/form-row';
import { ModalFooter } from '../../../../modal/modal-footer';
import { AFFINITY_CONDITION_LABELS, AFFINITY_TYPE_LABLES } from '../../../shared/consts';
import { useNodeQualifier } from '../../../shared/hooks';
import { NodeChecker } from '../../../shared/NodeChecker/node-checker';
import { getIntersectedQualifiedNodes } from '../../helpers';
import { AffinityCondition, AffinityLabel, AffinityRowData } from '../../types';
import { getTopologyKeyValidation, isTermsInvalid, isWeightValid } from '../../validations';
import { AffinityExpressionList } from '../affinity-expression-list/affinity-expression-list';

import './affinity-edit.scss';

export const AffinityEdit: React.FC<AffinityEditProps> = ({
  nodes,
  affinity,
  isDisabled,
  onAffinitySubmit,
  onCancel,
}) => {
  const { t } = useTranslation();
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
  } = getTopologyKeyValidation(focusedAffinity, t);

  React.useEffect(() => {
    if (isTopologyDisabled && focusedAffinity.topologyKey !== 'kubernetes.io/hostname')
      setFocusedAffinity({ ...focusedAffinity, topologyKey: 'kubernetes.io/hostname' });
  }, [focusedAffinity, isTopologyDisabled]);

  const qualifiedExpressionNodes = useNodeQualifier(nodes, 'label', affinityExpressions);
  const qualifiedFieldNodes = useNodeQualifier(nodes, 'field', affinityFields);

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
            {t(
              'kubevirt-plugin~Define an affinity rule. This rule will be added to the list of affinity rules applied to this workload.',
            )}
          </Text>
        </div>
        <Form>
          <FormRow title={t('kubevirt-plugin~Type')} fieldId={'affinity-type'} isRequired>
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
          <FormRow title={t('kubevirt-plugin~Condition')} fieldId={'affinity-condition'} isRequired>
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
                key={AffinityCondition.preferred}
                value={AffinityCondition.preferred}
                label={AFFINITY_CONDITION_LABELS[AffinityCondition.preferred]}
              />
              <FormSelectOption
                key={AffinityCondition.required}
                value={AffinityCondition.required}
                label={AFFINITY_CONDITION_LABELS[AffinityCondition.required]}
              />
            </FormSelect>
          </FormRow>
          {focusedAffinity?.condition === AffinityCondition.preferred && (
            <FormRow
              title={t('kubevirt-plugin~Weight')}
              fieldId={'weight'}
              validationType={
                isWeightInvalid ? ValidationErrorType.Error : ValidationErrorType.Info
              }
              validationMessage={t('kubevirt-plugin~Weight must be a number between 1-100')}
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
              title={t('kubevirt-plugin~Topology Key')}
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
            title={
              isNodeAffinity
                ? t('kubevirt-plugin~Node Labels')
                : t('kubevirt-plugin~Workload Labels')
            }
            fieldId={'expressions'}
            validationType={
              isExpressionsInvalid && initialAffinityChanged && ValidationErrorType.Error
            }
            validationMessage={
              isExpressionsInvalid && initialAffinityChanged && isNodeAffinity
                ? t('kubevirt-plugin~Missing fields in node labels')
                : t('kubevirt-plugin~Missing fields in workload labels')
            }
          >
            <div className="scheduling-modals__desc-container">
              {isNodeAffinity ? (
                <>
                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {t(
                      'kubevirt-plugin~Select nodes that must have all the following expressions.',
                    )}
                  </Text>
                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {t(
                      'kubevirt-plugin~Label selectors let you select Nodes based on the value of one or more labels.',
                    )}
                  </Text>
                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {t(
                      'kubevirt-plugin~A list of matching nodes will be provided on label input below.',
                    )}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="scheduling-modals__desc" component={TextVariants.small}>
                    {t(
                      'kubevirt-plugin~Select workloads that must have all the following expressions.',
                    )}
                  </Text>
                </>
              )}
            </div>
            <AffinityExpressionList
              expressions={affinityExpressions}
              addRowText={t('kubevirt-plugin~Add Expression')}
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
                title={t('kubevirt-plugin~Node Fields')}
                fieldId={'fields'}
                validationType={
                  isFieldsInvalid && initialAffinityChanged && ValidationErrorType.Error
                }
                validationMessage={
                  isFieldsInvalid &&
                  initialAffinityChanged &&
                  t('kubevirt-plugin~Missing fields in node fields')
                }
              >
                <div className="scheduling-modals__desc-container">
                  <>
                    <Text className="scheduling-modals__desc" component={TextVariants.small}>
                      {t(
                        'kubevirt-plugin~Field selectors let you select Nodes based on the value of one or more resource fields.',
                      )}
                    </Text>
                    <Text className="scheduling-modals__desc" component={TextVariants.small}>
                      {t(
                        'kubevirt-plugin~Note that for Node field expressions, entering a full path is required in the Key field (e.g. `metadata.name: value`).',
                      )}
                    </Text>
                    <Text className="scheduling-modals__desc" component={TextVariants.small}>
                      {t('kubevirt-plugin~Some fields may not be supported.')}
                    </Text>
                  </>
                </div>
                <AffinityExpressionList
                  expressions={affinityFields}
                  addRowText={t('kubevirt-plugin~Add Field')}
                  onAdd={onLabelFieldAdd}
                  onChange={onFieldChange}
                  onDelete={onFieldDelete}
                  rowID="affinity-field"
                />
              </FormRow>
              {(affinityExpressions.length > 0 || affinityFields.length > 0) && !isAffinityInvalid && (
                <NodeChecker
                  qualifiedNodes={getIntersectedQualifiedNodes({
                    expressionNodes: qualifiedExpressionNodes,
                    fieldNodes: qualifiedFieldNodes,
                    expressions: affinityExpressions,
                    fields: affinityFields,
                  })}
                />
              )}
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
        submitButtonText={t('kubevirt-plugin~Save Affinity rule')}
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
