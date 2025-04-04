import * as React from 'react';
import {
  Button,
  ButtonVariant,
  Divider,
  Form,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  FormGroup,
  FormHelperText,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  SelectOption,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';
import { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';
import * as _ from 'lodash';
import { TFunction, useTranslation } from 'react-i18next';
import { MatchExpression } from '@console/internal/module/k8s';
import { RedExclamationCircleIcon } from '@console/shared';
import { AsyncLoader } from './async-loader';
import './labelExpressionSelector.scss';
import { LabelValueSelectDropdown } from './label-values-select-dropdown';
import { SingleSelectDropdown } from './single-select-dropdown';

// Only selective operator are used as options.
enum Operator {
  In = 'In',
  NotIn = 'NotIn',
  Exists = 'Exists',
  DoesNotExist = 'DoesNotExist',
}

const getValidatedProp = (error: boolean) => (error ? 'error' : 'default');

/**
 * Set up an AsyncComponent to wrap the label-expression-selector to allow on demand loading to reduce the
 * vendor footprint size.
 */
export const LazyLabelExpressionSelector = (props: LabelExpressionSelectorProps) => (
  <AsyncLoader
    loader={() => import('./label-expression-selector').then((c) => c.LabelExpressionSelector)}
    {...props}
  />
);

export const isLabelOnlyOperator = (operator: string) =>
  [Operator.Exists, Operator.DoesNotExist].includes(operator as Operator);

const matchExpressionSummaryError = (expandString: string, t: TFunction): React.ReactNode => (
  <Split>
    <SplitItem>
      <RedExclamationCircleIcon />
    </SplitItem>
    <SplitItem>
      <span className="pf-v5-c-form__helper-text pf-m-error">
        &nbsp; {expandString || t('Expand to fix validation errors')}
      </span>
    </SplitItem>
  </Split>
);

export const matchExpressionSummary = (
  t: TFunction,
  expression: MatchExpression,
  expandString?: string,
  isValidationEnabled?: boolean,
) => {
  const { key, operator, values } = expression;

  // Skipping values check for label only operator.
  const hasError = !key || (isLabelOnlyOperator(operator) ? false : !values.length);

  // Converting the selected label expression as text to summerize,
  // Only for the display purpose
  let operatorStr = t('unknown');
  switch (operator) {
    case Operator.In:
      if (!!values && values.length > 1) {
        operatorStr = t('equals any of');
      } else {
        operatorStr = t('equals');
      }
      break;
    case Operator.NotIn:
      if (!!values && values.length > 1) {
        operatorStr = t('does not equal any of');
      } else {
        operatorStr = t('does not equal');
      }
      break;
    case Operator.Exists:
      operatorStr = t('exists');
      break;
    case Operator.DoesNotExist:
      operatorStr = t('does not exist');
      break;
    default:
      operatorStr = t('unknown');
      break;
  }

  if (isValidationEnabled && hasError) {
    return matchExpressionSummaryError(expandString, t);
  }
  return !key
    ? expandString || t('Expand to enter expression')
    : `${key} ${operatorStr} ${values.join(', ')}`;
};

const ExpressionElement: React.FC<ExpressionElementProps> = ({
  index,
  selectedExpression,
  labels,
  isValidationEnabled,
  onSelect,
}) => {
  const { key, operator, values } = selectedExpression;

  const { t } = useTranslation();

  // Display each label key as options
  const keyOptions = React.useMemo(
    () =>
      Object.keys(labels).map((labelKey) => (
        <SelectOption key={labelKey} value={labelKey}>
          {labelKey}
        </SelectOption>
      )),
    [labels],
  );

  // Default options of Operator enum.
  const operatorOptions = Object.values(Operator).map((option) => (
    <SelectOption key={option} value={option}>
      {option}
    </SelectOption>
  ));

  // Display each values of the selected key as options
  // Modify value options based on key selection.
  const valueOptions = React.useMemo(
    () =>
      (key ? labels[key] || [] : []).map((value) => (
        <SelectOption key={value} value={value}>
          {value}
        </SelectOption>
      )),
    [labels, key],
  );

  // Reset values when label is selected.
  const onKeyChange = React.useCallback(
    (selectedKey: string) => {
      onSelect(index, {
        key: selectedKey,
        operator,
        values: key === selectedKey ? values : [],
      });
    },
    [index, key, operator, values, onSelect],
  );

  // Reset values when label only operator is selected.
  const onOperatorChange = React.useCallback(
    (selectedOperator: Operator) => {
      onSelect(index, {
        ...selectedExpression,
        operator: selectedOperator,
        values: !isLabelOnlyOperator(selectedOperator) ? values : [],
      });
    },
    [index, selectedExpression, values, onSelect],
  );

  // Call onSelect to update the state
  const onValuesChange = React.useCallback(
    (selectedValues: string[]) => {
      onSelect(index, {
        ...selectedExpression,
        values: selectedValues,
      });
    },
    [index, selectedExpression, onSelect],
  );

  const isKeyValid = getValidatedProp(isValidationEnabled && !key);
  const isValuesValid = getValidatedProp(isValidationEnabled && !values.length);

  return (
    <Grid hasGutter>
      <GridItem lg={4} sm={4}>
        <FormGroup label={t('Label')} hasNoPaddingTop isRequired>
          <SingleSelectDropdown
            id="label-selection-dropdown"
            placeholderText={t('Select a label')}
            selectedKey={key}
            selectOptions={keyOptions}
            onChange={onKeyChange}
            required
            validated={isKeyValid}
            isCreatable
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem variant={isKeyValid}>
                {isKeyValid === 'error' && t('Required')}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      </GridItem>
      <GridItem lg={4} sm={4}>
        <FormGroup label={t('Operator')} hasNoPaddingTop>
          <SingleSelectDropdown
            id="operator-selection-dropdown"
            selectedKey={operator}
            selectOptions={operatorOptions}
            onChange={onOperatorChange}
            required
          />
        </FormGroup>
      </GridItem>
      {!isLabelOnlyOperator(operator) && (
        <GridItem lg={4} sm={4}>
          <FormGroup label={t('Values')} hasNoPaddingTop isRequired>
            <LabelValueSelectDropdown
              id="values-selection-dropdown"
              placeholderText={
                values?.length
                  ? t('{{count}} selected', { count: values.length })
                  : t('Select the values')
              }
              selections={values}
              selectOptions={valueOptions}
              onChange={onValuesChange}
              isCreatable
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={isValuesValid}>
                  {isValuesValid === 'error' && t('Required')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </GridItem>
      )}
    </Grid>
  );
};

const ArrayInput: React.FC<ArrayInputProps> = ({
  index,
  selectedExpression,
  labels,
  expandString,
  isValidationEnabled,
  DeleteIcon,
  onSelect,
}) => {
  const { t } = useTranslation();

  const expandSectionName = `expand-section-${index}`;

  return (
    <>
      <Divider />
      <Form>
        {/* Expand section */}
        <FormFieldGroupExpandable
          className="label-expression-selector__expandBody--padding-top"
          key={expandSectionName}
          toggleAriaLabel={expandSectionName}
          isExpanded
          header={
            // Expand section header
            <FormFieldGroupHeader
              titleText={{
                id: index.toString(),
                text: matchExpressionSummary(
                  t,
                  selectedExpression,
                  expandString,
                  isValidationEnabled,
                ),
              }}
              actions={
                <Button variant={ButtonVariant.plain} onClick={() => onSelect(index)}>
                  <DeleteIcon />
                </Button>
              }
            />
          }
        >
          {/* Expand section body */}
          <ExpressionElement
            index={index}
            selectedExpression={selectedExpression}
            labels={labels}
            isValidationEnabled={isValidationEnabled}
            onSelect={onSelect}
          />
        </FormFieldGroupExpandable>
      </Form>
      <Divider />
    </>
  );
};

export const LabelExpressionSelector: React.FC<LabelExpressionSelectorProps> = ({
  selectedExpressions,
  labels,
  expandString,
  addExpressionString,
  isValidationEnabled,
  DeleteIcon = TrashIcon,
  onChange,
}) => {
  const { t } = useTranslation();

  const onSelect = React.useCallback(
    (index: number, updatedExpression?: MatchExpression) => {
      const newExpressions = _.cloneDeep(selectedExpressions);
      if (updatedExpression) {
        // Update expression
        newExpressions[index] = updatedExpression;
      } else {
        // Delete expression
        newExpressions.splice(index, 1);
      }
      // Callback to update the state
      onChange(newExpressions);
    },
    [selectedExpressions, onChange],
  );

  const addExpression = React.useCallback(
    () =>
      onSelect(selectedExpressions.length, {
        key: '',
        operator: Operator.In, // In operator is a default selection
        values: [],
      }),
    [selectedExpressions, onSelect],
  );

  return (
    <div className="pf-v5-u-mt-sm">
      {selectedExpressions.map((expression, index) => (
        <ArrayInput
          key={`expression-${expression.key}-${expression.values.join('-')}`}
          index={index}
          selectedExpression={expression}
          labels={labels}
          expandString={expandString}
          isValidationEnabled={isValidationEnabled}
          DeleteIcon={DeleteIcon}
          onSelect={onSelect}
        />
      ))}
      <Button
        className="pf-v5-u-mt-md"
        type="button"
        variant={ButtonVariant.link}
        onClick={addExpression}
      >
        <PlusCircleIcon className="co-icon-space-r" />
        {addExpressionString || t('Add label expression')}
      </Button>
    </div>
  );
};

type ExpressionElementProps = {
  index: number;
  selectedExpression: MatchExpression;
  labels: {
    [key: string]: string[];
  };
  isValidationEnabled?: boolean;
  onSelect: (index: number, expression?: MatchExpression) => void;
};

type ArrayInputProps = ExpressionElementProps & {
  expandString?: string;
  DeleteIcon?: React.ComponentClass<SVGIconProps, any>;
};

export type LabelExpressionSelectorProps = {
  // Selected label selector expressions.
  selectedExpressions: MatchExpression[];
  // Labels to form the label selector expression options
  labels: {
    [key: string]: string[];
  };
  // Dispay text for the expand section.
  expandString?: string;
  // Display text to add more expression selector.
  addExpressionString?: string;
  // Make it 'true' for the form validation.
  isValidationEnabled?: boolean;
  // Delete expression selector icon
  DeleteIcon?: React.ComponentClass<SVGIconProps, any>;
  // Callback function to receive the updated expression list.
  onChange: (onChange: MatchExpression[]) => void;
};
