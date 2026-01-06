import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import {
  Button,
  Content,
  ContentVariants,
  FormGroup,
  FormHelperText,
  FormSection,
  HelperText,
  HelperTextItem,
  InputGroup,
  InputGroupItem,
  Stack,
  TextInput,
  Tooltip,
} from '@patternfly/react-core';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { DOC_URL_PROMETHEUS_MATCHERS } from '../../utils/documentation';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

const DEFAULT_RECEIVER_LABEL = 'All (default receiver)';

const hasDuplicateNames = (labels: string[]): boolean => {
  return labels.length !== _.uniq(labels).length;
};

export const RoutingLabelEditor = ({ formValues, dispatchFormChange, isDefaultReceiver }) => {
  const setRouteLabel = (path: number, v: string): void => {
    const labels = _.clone(formValues.routeLabels);
    labels.splice(path, 1, v);
    dispatchFormChange({
      type: 'setFormValues',
      payload: {
        routeLabels: labels,
        routeLabelDuplicateNamesError: hasDuplicateNames(labels),
      },
    });
  };

  const onRoutingLabelChange = (path: number): ((e) => void) => {
    return (e) => setRouteLabel(path, e.target.value);
  };

  const addRoutingLabel = (): void => {
    setRouteLabel(formValues.routeLabels.length, '');
  };

  const removeRoutingLabel = (i: number): void => {
    const labels = _.clone(formValues.routeLabels);
    labels.splice(i, 1);
    dispatchFormChange({
      type: 'setFormValues',
      payload: {
        routeLabels: labels,
        routeLabelDuplicateNamesError: hasDuplicateNames(labels),
      },
    });
  };

  const { t } = useTranslation();

  return (
    <FormSection
      title={
        <>
          {t('public~Routing labels')}{' '}
          {!isDefaultReceiver && (
            <span className="pf-v6-c-form__label-required" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </>
      }
    >
      <Content component={ContentVariants.p} className="pf-v6-u-mb-0">
        <Trans ns="public">
          Firing alerts with labels that match all of these{' '}
          <ExternalLink href={DOC_URL_PROMETHEUS_MATCHERS} text={t('public~matchers')} /> will be
          sent to this receiver.
        </Trans>
      </Content>
      <FormGroup>
        <Stack hasGutter>
          {isDefaultReceiver && (
            <InputGroup>
              <InputGroupItem isFill>
                <TextInput type="text" value={DEFAULT_RECEIVER_LABEL} isDisabled isRequired />
              </InputGroupItem>
            </InputGroup>
          )}
          {_.map(formValues.routeLabels, (routeLabel, i: number) => {
            return (
              <InputGroup key={i}>
                <InputGroupItem isFill>
                  <TextInput
                    id={`routing-label-${i}`}
                    type="text"
                    data-test={`label-${i}`}
                    onChange={onRoutingLabelChange(i)}
                    placeholder={t('public~Matcher')}
                    value={routeLabel}
                    aria-describedby="routing-labels-help"
                  />
                </InputGroupItem>
                <InputGroupItem>
                  <Tooltip content={t('public~Remove')}>
                    <Button
                      icon={<MinusCircleIcon />}
                      type="button"
                      onClick={() => removeRoutingLabel(i)}
                      aria-label={t('public~Remove')}
                      isDisabled={!isDefaultReceiver && formValues.routeLabels.length <= 1}
                      variant="plain"
                    />
                  </Tooltip>
                </InputGroupItem>
              </InputGroup>
            );
          })}
        </Stack>
      </FormGroup>
      {formValues.routeLabelDuplicateNamesError && (
        <FormHelperText className="pf-v6-u-mb-0">
          <HelperText>
            <HelperTextItem
              icon={<ExclamationCircleIcon />}
              variant="error"
              id="routing-labels-help"
              aria-live="polite"
              aria-invalid={formValues.routeLabelDuplicateNamesError}
            >
              {t('public~Routing label names must be unique.')}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
      {!isDefaultReceiver && (
        <Button
          icon={<PlusCircleIcon />}
          onClick={addRoutingLabel}
          type="button"
          variant="link"
          isInline
        >
          {t('public~Add label')}
        </Button>
      )}
    </FormSection>
  );
};
