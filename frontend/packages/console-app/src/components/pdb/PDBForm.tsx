import * as React from 'react';
import {
  ActionGroup,
  Button,
  Form,
  TextInput,
  FormGroup,
  Content,
  Title,
  ValidatedOptions,
  Select,
  SelectList,
  SelectOption,
  Stack,
  StackItem,
  Split,
  SplitItem,
  HelperTextItem,
  HelperText,
  FormHelperText,
  FormAlert,
  Alert,
  MenuToggle,
  MenuToggleElement,
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
import { pdbToK8sResource, initialValuesFromK8sResource, patchPDB, FormValues } from './pdb-models';
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

function checkAvailabilityRequirementValue(formValues: FormValues, replicasCount: number) {
  const { maxUnavailable, minAvailable } = formValues;
  const minAvailableToStr = String(minAvailable);

  if (minAvailableToStr.includes('%')) {
    return parseInt(minAvailableToStr.slice(0, -1), 10) >= 100;
  }

  return (
    parseInt(String(maxUnavailable), 10) === 0 || parseInt(minAvailableToStr, 10) >= replicasCount
  );
}

const PDBForm: React.FC<PodDisruptionBudgetFormProps> = ({
  formData,
  onChange,
  existingResource,
  replicasCount,
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
  const items: RequirementItems = React.useMemo(
    () => ({
      maxUnavailable: t('console-app~maxUnavailable'),
      minAvailable: t('console-app~minAvailable'),
    }),
    [t],
  );
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

    if (formValues.requirement !== i18next.t('console-app~Requirement')) {
      setDisabled(false);
    }

    if (!_.isEmpty(existingResource) && _.isEmpty(formValues.name)) {
      onFormValuesChange(initialValuesFromK8sResource(existingResource));
    }
  }, [existingResource, formValues, onFormValuesChange, requirement, items]);

  const handleNameChange = (_event, value: string) =>
    onFormValuesChange({ ...formValues, name: value });

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
  const handleAvailabilityRequirementValueChange = (_event, value: string | number) => {
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
              labelHelp={
                <FieldLevelHelp>
                  <Title headingLevel="h3">{t('console-app~Selector')}</Title>
                  <Content component="p" className="pdb-form-popover__description">
                    {t(
                      'console-app~Label query over pods whose evictions are managed by the disruption budget. Anull selector will match no pods, while an empty ({}) selector will select all pods within the namespace.',
                    )}
                  </Content>
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
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem variant="warning">
                        {t(
                          'console-app~Resource is already covered by another PodDisruptionBudget',
                        )}
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </StackItem>
              )}
            </FormGroup>
          </StackItem>
          <StackItem>
            <FormGroup
              fieldId="pdb-requirement"
              label={t('console-app~Availability requirement')}
              labelHelp={<AvailabilityRequirementPopover />}
            />
            <Split hasGutter>
              <SplitItem isFilled>
                <Select
                  isOpen={isOpen}
                  onOpenChange={(open) => setOpen(open)}
                  selected={selectedRequirement}
                  onSelect={(value: string) => handleAvailabilityRequirementKeyChange(value)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      isExpanded={isOpen}
                      isFullWidth
                      onClick={(open) => setOpen(open)}
                    >
                      {selectedRequirement}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {Object.keys(items).map((key) => (
                      <SelectOption
                        key={key}
                        value={key}
                        onClick={() => handleAvailabilityRequirementKeyChange(key)}
                      >
                        {items[key]}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
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
                    checkAvailabilityRequirementValue(formValues, replicasCount)
                      ? ValidatedOptions.warning
                      : ValidatedOptions.default
                  }
                />
              </SplitItem>
            </Split>
          </StackItem>
          {checkAvailabilityRequirementValue(formValues, replicasCount) && (
            <StackItem>
              <FormAlert>
                <Alert
                  variant="warning"
                  title={t('console-app~Availability requirement value warning')}
                  aria-live="polite"
                  isInline
                >
                  {t(
                    'console-app~A maxUnavailable of 0% or 0 or a minAvailable of 100% or greater than or equal to the number of replicas is permitted but can block nodes from being drained.',
                  )}
                </Alert>
              </FormAlert>
            </StackItem>
          )}
          <StackItem>
            <ButtonBar errorMessage={error} inProgress={inProgress}>
              <ActionGroup className="pf-v5-c-form">
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
  replicasCount: number;
};

type RequirementItems = {
  maxUnavailable: string;
  minAvailable: string;
};
