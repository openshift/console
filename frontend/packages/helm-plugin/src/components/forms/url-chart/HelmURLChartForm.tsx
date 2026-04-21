import type { FC, Ref } from 'react';
import { useEffect, useMemo, useState, useRef } from 'react';
import type { MenuToggleElement } from '@patternfly/react-core';
import {
  TextInputTypes,
  Grid,
  GridItem,
  Button,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';
import type { FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { SecretKind } from '@console/internal/module/k8s';
import { InputField, FormFooter, FormBody, FormHeader, FlexForm } from '@console/shared';
import type { HelmURLChartFormData } from './types';

export interface HelmURLChartFormProps {
  namespace: string;
  onNext: () => void;
}

const HelmURLChartForm: FC<FormikProps<HelmURLChartFormData> & HelmURLChartFormProps> = ({
  handleReset,
  status,
  isSubmitting,
  onNext,
  namespace,
  isValid,
  dirty,
  values,
  setFieldValue,
  setFieldError,
}) => {
  const { t } = useTranslation();

  const [isSecretSelectOpen, setIsSecretSelectOpen] = useState(false);
  const [secretFilterValue, setSecretFilterValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>();

  const [secrets, secretsLoaded] = useK8sWatchResource<SecretKind[]>({
    kind: SecretModel.kind,
    namespace,
    isList: true,
  });

  const basicAuthSecrets = useMemo(() => {
    if (!secretsLoaded || !secrets) {
      return [];
    }
    return secrets.filter((secret) => {
      const data = secret.data || {};
      return 'username' in data && 'password' in data;
    });
  }, [secrets, secretsLoaded]);

  const filteredSecrets = useMemo(
    () =>
      secretFilterValue
        ? basicAuthSecrets.filter((s) =>
            s.metadata.name.toLowerCase().includes(secretFilterValue.toLowerCase()),
          )
        : basicAuthSecrets,
    [basicAuthSecrets, secretFilterValue],
  );

  const handleSecretSelect = (
    _event: React.MouseEvent | React.ChangeEvent,
    value: string | number,
  ) => {
    setFieldValue('basicAuthSecretName', value as string);
    setSecretFilterValue('');
    setIsSecretSelectOpen(false);
    textInputRef?.current?.focus();
  };

  const handleSecretClear = () => {
    setFieldValue('basicAuthSecretName', '');
    setSecretFilterValue('');
    textInputRef?.current?.focus();
  };

  const isNextDisabled = !isValid || !dirty || isSubmitting;

  // Auto-populate releaseName and chartVersion from URL
  useEffect(() => {
    if (!values.chartURL) return;
    let url: URL;
    try {
      url = new URL(values.chartURL);
    } catch {
      setFieldError('chartURL', t('helm-plugin~Invalid chart URL format.'));
      return;
    }
    const scheme = url.protocol;
    const filename = url.pathname.split('/').pop() || '';
    let chartName = '';
    let chartVersion = '';

    if (scheme === 'oci:') {
      // e.g. "mychart:1.0.0" -> name "mychart", version "1.0.0"
      [chartName, chartVersion] = filename.split(':');
    } else {
      // e.g. "exateapigator-0.1.0.tgz" -> name "exateapigator", version "0.1.0"
      const base = filename.replace(/\.(tgz|tar\.gz)$/, '');

      // Handle semVer cases like "my-chart-1.0.0-rc.1.tgz, if the last hyphen is followed by a digit"
      const lastHyphen = base.lastIndexOf('-');
      if (lastHyphen >= 0 && lastHyphen < base.length - 1 && base[lastHyphen + 1].match(/^\d/)) {
        chartName = base.slice(0, lastHyphen);
        chartVersion = base.slice(lastHyphen + 1);
      }
    }

    if (chartName) {
      setFieldValue('releaseName', chartName);
    }
    if (chartVersion) {
      setFieldValue('chartVersion', chartVersion);
    }
  }, [values.chartURL, setFieldValue, setFieldError, t]);

  return (
    <FlexForm
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <FormBody flexLayout>
        <FormHeader
          title={t('helm-plugin~Install Helm chart from URL')}
          helpText={t(
            'helm-plugin~To install a Helm chart, enter the chart URL - Open Container Initiative (OCI) URL or HTTP/HTTPS tar file and version.',
          )}
          marginBottom="lg"
        />
        <FormSection fullWidth>
          <Grid hasGutter>
            <GridItem md={12}>
              <InputField
                type={TextInputTypes.text}
                name="chartURL"
                label={t('helm-plugin~Chart URL')}
                helpText={t(
                  'helm-plugin~The OCI URL or HTTP/HTTPS tar file for the Helm chart; for example - oci://registry.example.com/charts/mychart or https://example.com/chart-1.0.0.tgz.',
                )}
                placeholder="oci://registry.example.com/charts/mychart or https://example.com/chart-1.0.0.tgz"
                required
                data-test="oci-chart-url"
              />
            </GridItem>
            <GridItem md={6}>
              <InputField
                type={TextInputTypes.text}
                name="releaseName"
                label={t('helm-plugin~Release name')}
                helpText={t('helm-plugin~Unique name for Helm release.')}
                required
                data-test="oci-release-name"
              />
            </GridItem>
            <GridItem md={6}>
              <InputField
                type={TextInputTypes.text}
                name="chartVersion"
                label={t('helm-plugin~Chart version')}
                helpText={t('helm-plugin~The version of chart to install.')}
                placeholder="1.0.0"
                required
                data-test="oci-chart-version"
              />
            </GridItem>
            <GridItem md={12}>
              <FormGroup
                label={t('helm-plugin~Secret for basic authentication.')}
                fieldId="basic-auth-secret"
              >
                <Select
                  id="basic-auth-secret"
                  isOpen={isSecretSelectOpen}
                  selected={values.basicAuthSecretName}
                  onSelect={handleSecretSelect}
                  onOpenChange={(open) => setIsSecretSelectOpen(open)}
                  toggle={(toggleRef: Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      variant="typeahead"
                      onClick={() => setIsSecretSelectOpen((prev) => !prev)}
                      isExpanded={isSecretSelectOpen}
                      isDisabled={!secretsLoaded}
                      isFullWidth
                      data-test="basic-auth-secret"
                    >
                      <TextInputGroup isPlain>
                        <TextInputGroupMain
                          value={
                            values.basicAuthSecretName
                              ? values.basicAuthSecretName
                              : secretFilterValue
                          }
                          onClick={() => setIsSecretSelectOpen(true)}
                          onChange={(_event, val) => {
                            setSecretFilterValue(val);
                            if (!isSecretSelectOpen) {
                              setIsSecretSelectOpen(true);
                            }
                          }}
                          autoComplete="off"
                          innerRef={textInputRef}
                          placeholder={t('helm-plugin~Select a secret')}
                          aria-label={t('helm-plugin~Select a secret')}
                          role="combobox"
                          isExpanded={isSecretSelectOpen}
                          aria-controls="basic-auth-secret-listbox"
                        />
                        {(values.basicAuthSecretName || secretFilterValue) && (
                          <TextInputGroupUtilities>
                            <Button
                              variant="plain"
                              onClick={handleSecretClear}
                              aria-label={t('helm-plugin~Clear selection')}
                            >
                              <TimesIcon />
                            </Button>
                          </TextInputGroupUtilities>
                        )}
                      </TextInputGroup>
                    </MenuToggle>
                  )}
                >
                  <SelectList id="basic-auth-secret-listbox">
                    {!secretsLoaded && (
                      <SelectOption isDisabled value="loading">
                        {t('helm-plugin~Loading secrets...')}
                      </SelectOption>
                    )}
                    {secretsLoaded && filteredSecrets.length === 0 && (
                      <SelectOption isDisabled value="no-results">
                        {t('helm-plugin~No secrets with username and password found')}
                      </SelectOption>
                    )}
                    {secretsLoaded &&
                      filteredSecrets.map((secret) => (
                        <SelectOption key={secret.metadata.uid} value={secret.metadata.name}>
                          {secret.metadata.name}
                        </SelectOption>
                      ))}
                  </SelectList>
                </Select>
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      {t(
                        'helm-plugin~A secret with "username" and "password" keys for OCI/HTTP(S) authentication',
                      )}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
            </GridItem>
          </Grid>
        </FormSection>
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('helm-plugin~Next')}
        disableSubmit={isNextDisabled}
        resetLabel={t('helm-plugin~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default HelmURLChartForm;
