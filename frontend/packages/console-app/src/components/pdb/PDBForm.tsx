import * as React from 'react';
import {
  ActionGroup,
  Button,
  Form,
  TextInput,
  FormGroup,
  Text,
  Title,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  ValidatedOptions,
  Stack,
  StackItem,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import i18next from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { MatchLabels } from '@console/dynamic-plugin-sdk/src/api/common-types';
import {
  ButtonBar,
  history,
  SelectorInput,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';
import { k8sCreate } from '@console/internal/module/k8s';
import { PodDisruptionBudgetModel } from '../../models';
import AvailabilityRequirementPopover from './AvailabilityRequirementPopover';
import { pdbToK8sResource, initialValuesFromK8sResource, patchPDB } from './pdb-models';
import { PodDisruptionBudgetKind } from './types';

const getSelectedRequirement = (requirement: string, items: RequirementItems): string => {
  if (requirement === 'minAvailable') {
    return items.minAvailable;
  }
  if (requirement === 'maxUnavailable') {
    return items.maxUnavailable;
  }
  return i18next.t('console-app~Requirement');
};

const PDBForm: React.FC<PodDisruptionBudgetFormProps> = ({
  formData,
  onChange,
  existingResource,
}) => {
  const { t } = useTranslation();
  const initialFormValues = initialValuesFromK8sResource(formData);
  const [formValues, setFormValues] = React.useState(initialFormValues);
  const [error, setError] = React.useState('');
  const [inProgress, setInProgress] = React.useState(false);
  const [requirement, setRequirement] = React.useState('');
  const [isDisabled, setDisabled] = React.useState(true);
  const [labels, setLabels] = React.useState([]);
  const [matchingSelector, setMatchingSelector] = React.useState<PodDisruptionBudgetKind>(null);
  const [isOpen, setOpen] = React.useState(false);
  const onToggle = (open: boolean) => setOpen(open);
  const items: RequirementItems = {
    maxUnavailable: t('console-app~maxUnavailable'),
    minAvailable: t('console-app~minAvailable'),
  };
  const selectedRequirement = getSelectedRequirement(formValues.requirement, items);

  const onFormValuesChange = React.useCallback(
    (values) => {
      setFormValues(values);
      onChange(pdbToK8sResource(values, existingResource));
    },
    [onChange, existingResource],
  );

  React.useEffect(() => {
    setRequirement(formValues.requirement);

    if (!_.isEmpty(existingResource) && _.isEmpty(formValues.name)) {
      onFormValuesChange(initialValuesFromK8sResource(existingResource));
    }
  }, [existingResource, formValues, onFormValuesChange, requirement, items]);

  const handleNameChange = (value: string) => onFormValuesChange({ ...formValues, name: value });

  const handleSelectorChange = (labelValues: string[]) => {
    const filterMatchLabels = labelValues.filter((f) => f.includes('='));
    const filterMatchExpressions = labelValues.filter((f) => !f.includes('='));
    onFormValuesChange({
      ...formValues,
      selector: {
        matchLabels: SelectorInput.objectify(filterMatchLabels),
        matchExpressions: SelectorInput.arrayToArrayOfObjects(filterMatchExpressions),
      },
    });
    setLabels([...labels, ...labelValues]);
    setMatchingSelector(existingResource);
  };

  const handleAvailabilityRequirementKeyChange = (value: string) => {
    setRequirement(value);
    setOpen(!isOpen);
    setDisabled(false);
    onFormValuesChange({
      ...formValues,
      requirement: value,
      minAvailable: '',
      maxUnavailable: '',
    });
  };
  const handleAvailabilityRequirementValueChange = (value: string | number) => {
    onFormValuesChange({ ...formValues, [requirement]: value });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setInProgress(true);

    const response = existingResource
      ? patchPDB(formValues, existingResource)
      : k8sCreate(PodDisruptionBudgetModel, pdbToK8sResource(formValues));
    return response
      .then(() => {
        setInProgress(false);
        history.push(
          resourcePathFromModel(PodDisruptionBudgetModel, formValues.name, formValues.namespace),
        );
      })
      .catch((err) => {
        setError(err.message);
        setInProgress(false);
      });
  };

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Form onSubmit={handleSubmit}>
        <Stack hasGutter>
          <StackItem>
            <FormGroup label={t('console-app~Name')} isRequired fieldId="pdb-name">
              <TextInput
                isRequired
                type="text"
                name="name"
                id="pdb-name"
                placeholder="example"
                value={formValues.name}
                onChange={handleNameChange}
                isDisabled={!!existingResource}
                autoFocus
              />
            </FormGroup>
          </StackItem>
          <StackItem>
            <FormGroup
              label={t('console-app~Labels')}
              fieldId="pdb-labels"
              labelIcon={
                <FieldLevelHelp>
                  <Title headingLevel="h3">{t('console-app~Selector')}</Title>
                  <Text className="pdb-form-popover__description">
                    {t(
                      'console-app~Label query over pods whose evictions are managed by the disruption budget. Anull selector will match no pods, while an empty ({}) selector will select all pods within the namespace.',
                    )}
                  </Text>
                </FieldLevelHelp>
              }
            >
              <SelectorInput
                onChange={(l) => handleSelectorChange(l)}
                tags={[
                  ...SelectorInput.arrayify(formValues.selector.matchLabels),
                  ...SelectorInput.arrayObjectsToArrayStrings(formValues.selector.matchExpressions),
                ]}
                labelClassName="labelClassName"
              />
              {matchingSelector && (
                <StackItem>
                  <FormGroup
                    fieldId="pdb-labels-validation"
                    helperText={t(
                      'console-app~Resource is already covered by another PodDisruptionBudget',
                    )}
                    validated={'warning'}
                  />
                </StackItem>
              )}
            </FormGroup>
          </StackItem>
          <StackItem>
            <FormGroup
              fieldId="pdb-requirement"
              label={t('console-app~Availability requirement')}
              labelIcon={<AvailabilityRequirementPopover />}
            />
            <Split hasGutter>
              <SplitItem isFilled>
                <Dropdown
                  className="dropdown--full-width"
                  toggle={
                    <DropdownToggle onToggle={onToggle}>{selectedRequirement}</DropdownToggle>
                  }
                  isOpen={isOpen}
                  dropdownItems={Object.keys(items).map((key) => (
                    <DropdownItem
                      key={key}
                      component="button"
                      onClick={() => handleAvailabilityRequirementKeyChange(key)}
                    >
                      {items[key]}
                    </DropdownItem>
                  ))}
                />
              </SplitItem>
              <SplitItem isFilled>
                <TextInput
                  type="text"
                  aria-label={t('console-app~Availability requirement value')}
                  onChange={handleAvailabilityRequirementValueChange}
                  value={
                    formValues?.minAvailable?.toString() || formValues?.maxUnavailable?.toString()
                  }
                  placeholder={t('console-app~Value (% or number)')}
                  name="availability requirement value"
                  isDisabled={isDisabled}
                  validated={
                    formValues.maxUnavailable === '0'
                      ? ValidatedOptions.warning
                      : ValidatedOptions.default
                  }
                />
              </SplitItem>
            </Split>
          </StackItem>
          {formValues.maxUnavailable === '0' && (
            <StackItem>
              <FormGroup
                fieldId="pdb-maxUnavailable-validation"
                helperText={t(
                  'console-app~The value of maxUnavailable = 0 might not protect your pods from disruption',
                )}
                validated={ValidatedOptions.warning}
              />
            </StackItem>
          )}
          <StackItem>
            <ButtonBar errorMessage={error} inProgress={inProgress}>
              <ActionGroup className="pf-c-form">
                <Button
                  type="submit"
                  id="save-changes"
                  variant="primary"
                  isDisabled={!formValues.name}
                >
                  {existingResource ? t('console-app~Save') : t('console-app~Create')}
                </Button>
                <Button onClick={history.goBack} id="cancel" variant="secondary">
                  {t('console-app~Cancel')}
                </Button>
              </ActionGroup>
            </ButtonBar>
          </StackItem>
        </Stack>
      </Form>
    </div>
  );
};

export default PDBForm;

type PodDisruptionBudgetFormProps = {
  formData: PodDisruptionBudgetKind;
  onChange: (newFormData: PodDisruptionBudgetKind) => void;
  selector: MatchLabels;
  existingResource: PodDisruptionBudgetKind;
};

type RequirementItems = {
  maxUnavailable: string;
  minAvailable: string;
};
