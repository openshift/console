import type { FC } from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  FormGroup,
  TextInput,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Button,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  LabelGroup,
  Label,
  Radio,
  Form,
  ActionGroup,
  Alert,
  PageSection,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { NsDropdown, resourcePathFromModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NamespaceModel, ServiceAccountModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import SwitchToYAMLAlert from '@console/shared/src/components/alerts/SwitchToYAMLAlert';
import { SchemaFieldHelp } from '@console/shared/src/components/utils';
import { useTextInputModal } from '@console/shared/src/hooks';
import { CATALOG_LABEL_KEY } from '../../const';
import { ClusterExtensionModel } from '../../models';
import { ServiceAccountDropdown } from './ServiceAccountDropdown';

export interface ClusterExtensionFormProps {
  formData?: K8sResourceKind;
  onChange?: (data: K8sResourceKind) => void;
}

const ClusterExtensionForm: FC<ClusterExtensionFormProps> = ({ formData = {}, onChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const textInputModal = useTextInputModal();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract values from formData first
  const name = formData?.metadata?.name || '';
  const namespace = formData?.spec?.namespace || '';
  const serviceAccountName = formData?.spec?.serviceAccount?.name || '';

  // UI-only state (not part of formData)
  const [channelInputValue, setChannelInputValue] = useState('');
  const [catalogInputValue, setCatalogInputValue] = useState('');

  // Initialize radio button state based on formData values
  // If namespace matches name, assume it's auto-generated
  // Otherwise, assume it was manually set or selected from cluster
  const [useAutoNamespace, setUseAutoNamespace] = useState(() => !namespace || namespace === name);
  const [useAutoServiceAccount, setUseAutoServiceAccount] = useState(
    () => !serviceAccountName || serviceAccountName === `${name}-service-account`,
  );
  const packageName = formData?.spec?.source?.catalog?.packageName || '';
  const version = formData?.spec?.source?.catalog?.version || '';
  const channels = useMemo(() => formData?.spec?.source?.catalog?.channels || [], [
    formData?.spec?.source?.catalog?.channels,
  ]);

  // Extract catalogs from selector
  const catalogs = useMemo(() => {
    const selector = formData?.spec?.source?.catalog?.selector;
    if (!selector) return [];

    // Check matchLabels first
    const catalogLabel = selector.matchLabels?.['olm.operatorframework.io/metadata.name'];
    if (catalogLabel) return [catalogLabel];

    // Check matchExpressions for 'In' operator
    const matchExpr = selector.matchExpressions?.find(
      (expr: any) =>
        expr.key === 'olm.operatorframework.io/metadata.name' && expr.operator === 'In',
    );
    return matchExpr?.values || [];
  }, [formData?.spec?.source?.catalog?.selector]);

  // Helper to update formData at a specific path
  const updateFormDataPath = useCallback(
    (path: string | string[], value: any) => {
      if (!onChange) return;

      const updated = _.cloneDeep(formData);
      _.set(updated, path, value);
      onChange(updated);
    },
    [formData, onChange],
  );

  // Check if namespace exists
  const [namespaceResource, namespaceLoaded] = useK8sWatchResource<K8sResourceKind>(
    namespace
      ? {
          kind: NamespaceModel.kind,
          name: namespace,
        }
      : null,
  );

  // Check if service account exists in the selected namespace
  const [serviceAccountResource, serviceAccountLoaded] = useK8sWatchResource<K8sResourceKind>(
    namespace && serviceAccountName
      ? {
          kind: ServiceAccountModel.kind,
          name: serviceAccountName,
          namespace,
        }
      : null,
  );

  const namespaceExists = namespaceLoaded && !!namespaceResource;
  const serviceAccountExists = serviceAccountLoaded && !!serviceAccountResource;

  // Auto-switch to "Select from cluster" if the namespace exists
  useEffect(() => {
    if (namespaceExists && useAutoNamespace) {
      setUseAutoNamespace(false);
    }
  }, [namespaceExists, useAutoNamespace]);

  // Auto-switch to "Select from cluster" if the service account exists
  useEffect(() => {
    if (serviceAccountExists && useAutoServiceAccount) {
      setUseAutoServiceAccount(false);
    }
  }, [serviceAccountExists, useAutoServiceAccount]);

  const handleNameChange = useCallback(
    (_event: any, value: string) => {
      updateFormDataPath('metadata.name', value);
    },
    [updateFormDataPath],
  );

  const handlePackageNameChange = useCallback(
    (_event: any, value: string) => {
      updateFormDataPath('spec.source.catalog.packageName', value);
    },
    [updateFormDataPath],
  );

  const handleNamespaceChange = useCallback(
    (value: string) => {
      updateFormDataPath('spec.namespace', value);
    },
    [updateFormDataPath],
  );

  const handleServiceAccountNameChange = useCallback(
    (value: string) => {
      updateFormDataPath('spec.serviceAccount.name', value);
    },
    [updateFormDataPath],
  );

  const handleVersionChange = useCallback(
    (_event: any, value: string) => {
      updateFormDataPath('spec.source.catalog.version', value || undefined);
    },
    [updateFormDataPath],
  );

  const handleChannelInputChange = useCallback((_event: any, value: string) => {
    setChannelInputValue(value);
  }, []);

  const handleChannelKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const currentToken = channelInputValue.trim();
      if (event.key === 'Enter' && currentToken) {
        event.preventDefault();
        if (!channels.includes(currentToken)) {
          updateFormDataPath('spec.source.catalog.channels', [...channels, currentToken]);
        }
        setChannelInputValue('');
      }
    },
    [channels, channelInputValue, updateFormDataPath],
  );

  const handleChannelRemove = useCallback(
    (channelToRemove: string) => {
      const newChannels = channels.filter((ch: string) => ch !== channelToRemove);
      updateFormDataPath(
        'spec.source.catalog.channels',
        newChannels.length > 0 ? newChannels : undefined,
      );
    },
    [channels, updateFormDataPath],
  );

  const handleCatalogInputChange = useCallback((_event: any, value: string) => {
    setCatalogInputValue(value);
  }, []);

  const handleCatalogKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const currentToken = catalogInputValue.trim();
      if (event.key === 'Enter' && currentToken) {
        event.preventDefault();
        if (!catalogs.includes(currentToken)) {
          const newCatalogs = [...catalogs, currentToken];
          // Build catalog selector based on number of catalogs
          let selector: any;
          if (newCatalogs.length === 1) {
            selector = {
              matchLabels: {
                [CATALOG_LABEL_KEY]: newCatalogs[0],
              },
            };
          } else if (newCatalogs.length > 1) {
            selector = {
              matchExpressions: [
                {
                  key: CATALOG_LABEL_KEY,
                  operator: 'In',
                  values: newCatalogs,
                },
              ],
            };
          }

          updateFormDataPath('spec.source.catalog.selector', selector);
        }
        setCatalogInputValue('');
      }
    },
    [catalogs, catalogInputValue, updateFormDataPath],
  );

  const handleCatalogRemove = useCallback(
    (catalogToRemove: string) => {
      const newCatalogs = catalogs.filter((cat: string) => cat !== catalogToRemove);
      // Build catalog selector based on number of catalogs
      let selector: any;
      if (newCatalogs.length === 1) {
        selector = {
          matchLabels: {
            [CATALOG_LABEL_KEY]: newCatalogs[0],
          },
        };
      } else if (newCatalogs.length > 1) {
        selector = {
          matchExpressions: [
            {
              key: CATALOG_LABEL_KEY,
              operator: 'In',
              values: newCatalogs,
            },
          ],
        };
      }

      updateFormDataPath('spec.source.catalog.selector', selector || undefined);
    },
    [catalogs, updateFormDataPath],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setIsSubmitting(true);
      setError(null);

      try {
        // Create namespace if "Create new Namespace" is selected
        if (useAutoNamespace && namespace) {
          try {
            await k8sCreateResource({
              model: NamespaceModel,
              data: {
                metadata: {
                  name: namespace,
                },
              },
            });
          } catch (err) {
            // Ignore error if namespace already exists
            if (!err.message?.includes('already exists')) {
              throw err;
            }
          }
        }

        // Create service account if "Create new ServiceAccount" is selected
        if (useAutoServiceAccount && serviceAccountName && namespace) {
          try {
            await k8sCreateResource({
              model: ServiceAccountModel,
              data: {
                metadata: {
                  name: serviceAccountName,
                  namespace,
                },
              },
            });
          } catch (err) {
            // Ignore error if service account already exists
            if (!err.message?.includes('already exists')) {
              throw err;
            }
          }
        }

        // Create the ClusterExtension
        const created = await k8sCreateResource({
          model: ClusterExtensionModel,
          data: formData,
        });
        navigate(resourcePathFromModel(ClusterExtensionModel, created.metadata.name));
      } catch (err) {
        setError(
          t('olm-v1~An error occurred creating the ClusterExtension: {error}', {
            error: err.toString(),
          }),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, navigate, t, useAutoNamespace, useAutoServiceAccount, namespace, serviceAccountName],
  );

  const isValid = name && packageName && namespace && serviceAccountName;

  return (
    <PageSection hasBodyWrapper={false}>
      <Form onSubmit={handleSubmit}>
        <SwitchToYAMLAlert />
        <FormGroup label={t('olm-v1~Name')} isRequired fieldId="cluster-extension-name">
          <TextInput
            isRequired
            type="text"
            id="cluster-extension-name"
            value={name}
            onChange={handleNameChange}
            aria-label={t('olm-v1~Name')}
          />
        </FormGroup>

        <FormGroup
          label={t('olm-v1~Package name')}
          isRequired
          fieldId="package-name"
          labelHelp={
            <SchemaFieldHelp
              model={ClusterExtensionModel}
              propertyPath="spec.source.catalog.packageName"
              headerContent={t('olm-v1~Package name')}
              ariaLabel={t('olm-v1~Package name help')}
              fallbackDescription={t('olm-v1~Package name description')}
            />
          }
        >
          <TextInput
            isRequired
            type="text"
            id="package-name"
            value={packageName}
            onChange={handlePackageNameChange}
            aria-label={t('olm-v1~Package name')}
          />
        </FormGroup>

        <FormGroup
          label={t('olm-v1~Namespace')}
          isRequired
          fieldId="namespace"
          labelHelp={
            <SchemaFieldHelp
              model={ClusterExtensionModel}
              propertyPath="spec.namespace"
              headerContent={t('olm-v1~Namespace')}
              ariaLabel={t('olm-v1~Namespace help')}
              fallbackDescription={t('olm-v1~Namespace description')}
            />
          }
        >
          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                {t(
                  'olm-v1~Namespace for the operator controller, manifest, etc. A dedicated operator namespace is recommended.',
                )}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
          <FormGroup role="radiogroup" fieldId="namespace-option" isStack>
            <Radio
              id="namespace-auto"
              name="namespace-option"
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>
                    {t('olm-v1~Create new Namespace')}
                    {namespace && (
                      <>
                        : <strong>{useAutoNamespace ? namespace : name}</strong>
                      </>
                    )}
                  </span>
                  {namespace && useAutoNamespace && (
                    <Button
                      variant="plain"
                      onClick={(e) => {
                        e.stopPropagation();
                        textInputModal({
                          title: t('olm-v1~Edit Namespace Name'),
                          label: t('olm-v1~Namespace'),
                          initialValue: name,
                          onSubmit: handleNamespaceChange,
                        });
                      }}
                      aria-label={t('olm-v1~Edit namespace name')}
                      style={{ padding: '0', minWidth: 'auto' }}
                    >
                      <PencilAltIcon />
                    </Button>
                  )}
                </span>
              }
              onChange={() => {
                setUseAutoNamespace(true);
                handleNamespaceChange(name);
              }}
              isChecked={useAutoNamespace}
            />
            <Radio
              id="namespace-select"
              name="namespace-option"
              label={t('olm-v1~Select from cluster')}
              onChange={() => {
                setUseAutoNamespace(false);
              }}
              isChecked={!useAutoNamespace}
            />
            {!useAutoNamespace && (
              <NsDropdown id="namespace" selectedKey={namespace} onChange={handleNamespaceChange} />
            )}
          </FormGroup>
        </FormGroup>

        <FormGroup
          label={t('olm-v1~Service Account')}
          isRequired
          fieldId="service-account"
          labelHelp={
            <SchemaFieldHelp
              model={ClusterExtensionModel}
              propertyPath="spec.serviceAccount.name"
              headerContent={t('olm-v1~Service Account')}
              ariaLabel={t('olm-v1~Service Account help')}
              fallbackDescription={t('olm-v1~Service Account description')}
            />
          }
        >
          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                {t(
                  'olm-v1~Service account must be in the selected namespace. A dedicated service account for the operator is recommended.',
                )}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
          <FormGroup role="radiogroup" fieldId="service-account-option" isStack>
            <Radio
              id="service-account-auto"
              name="service-account-option"
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>
                    {t('olm-v1~Create new ServiceAccount')}
                    {serviceAccountName && (
                      <>
                        :{' '}
                        <strong>
                          {useAutoServiceAccount ? serviceAccountName : `${name}-service-account`}
                        </strong>
                      </>
                    )}
                  </span>
                  {serviceAccountName && useAutoServiceAccount && (
                    <Button
                      variant="plain"
                      onClick={(e) => {
                        e.stopPropagation();
                        textInputModal({
                          title: t('olm-v1~Edit ServiceAccount Name'),
                          label: t('olm-v1~Service Account Name'),
                          initialValue: serviceAccountName,
                          onSubmit: handleServiceAccountNameChange,
                        });
                      }}
                      aria-label={t('olm-v1~Edit service account name')}
                      style={{ padding: '0', minWidth: 'auto' }}
                    >
                      <PencilAltIcon />
                    </Button>
                  )}
                </span>
              }
              onChange={() => {
                setUseAutoServiceAccount(true);
                handleServiceAccountNameChange(`${name}-service-account`);
              }}
              isChecked={useAutoServiceAccount}
            />
            <Radio
              id="service-account-select"
              name="service-account-option"
              label={t('olm-v1~Select from cluster')}
              onChange={() => {
                setUseAutoServiceAccount(false);
              }}
              isChecked={!useAutoServiceAccount}
            />
            {!useAutoServiceAccount && (
              <ServiceAccountDropdown
                id="service-account"
                namespace={namespace}
                selectedKey={serviceAccountName}
                onChange={handleServiceAccountNameChange}
              />
            )}
          </FormGroup>
        </FormGroup>

        <FormGroup
          label={t('olm-v1~Version or Version range')}
          labelHelp={
            <SchemaFieldHelp
              model={ClusterExtensionModel}
              propertyPath="spec.source.catalog.version"
              headerContent={t('olm-v1~Version')}
              ariaLabel={t('olm-v1~Version help')}
              fallbackDescription={t('olm-v1~Version description')}
            />
          }
          fieldId="version"
        >
          <TextInput
            type="text"
            id="version"
            value={version}
            onChange={handleVersionChange}
            aria-label={t('olm-v1~Version or Version range')}
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem>{t('olm-v1~e.g., 1.2.3 or >1.2.3 <1.4.5')}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>

        <FormGroup
          label={t('olm-v1~Channels')}
          fieldId="channels"
          labelHelp={
            <SchemaFieldHelp
              model={ClusterExtensionModel}
              propertyPath="spec.source.catalog.channels"
              headerContent={t('olm-v1~Channels')}
              ariaLabel={t('olm-v1~Channels help')}
              fallbackDescription={t('olm-v1~Channels description')}
            />
          }
        >
          <TextInputGroup>
            <TextInputGroupMain
              value={channelInputValue}
              onChange={handleChannelInputChange}
              onKeyDown={handleChannelKeyDown}
              id="channel"
              aria-label={t('olm-v1~Channels')}
              placeholder={t('olm-v1~e.g., stable, beta')}
            >
              <LabelGroup>
                {channels.map((ch: string) => (
                  <Label key={ch} onClose={() => handleChannelRemove(ch)} isCompact>
                    {ch}
                  </Label>
                ))}
              </LabelGroup>
            </TextInputGroupMain>
            {channels.length > 0 && (
              <TextInputGroupUtilities>
                <Button
                  variant="plain"
                  onClick={() => updateFormDataPath('spec.source.catalog.channels', undefined)}
                  aria-label={t('olm-v1~Clear all channels')}
                >
                  {t('olm-v1~Clear all')}
                </Button>
              </TextInputGroupUtilities>
            )}
          </TextInputGroup>
          <FormHelperText>
            <HelperText>
              <HelperTextItem>{t('olm-v1~e.g., stable, beta')}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>

        <FormGroup
          label={t('olm-v1~Catalogs')}
          fieldId="catalogs"
          labelHelp={
            <SchemaFieldHelp
              model={ClusterExtensionModel}
              propertyPath="spec.source.catalog.selector"
              headerContent={t('olm-v1~Catalogs')}
              ariaLabel={t('olm-v1~Catalogs help')}
              fallbackDescription={t('olm-v1~Catalogs description')}
            />
          }
        >
          <TextInputGroup>
            <TextInputGroupMain
              value={catalogInputValue}
              onChange={handleCatalogInputChange}
              onKeyDown={handleCatalogKeyDown}
              id="catalogs"
              aria-label={t('olm-v1~Catalogs')}
              placeholder={t('olm-v1~e.g., redhat-community-operators')}
            >
              <LabelGroup>
                {catalogs.map((cat: string) => (
                  <Label key={cat} onClose={() => handleCatalogRemove(cat)} isCompact>
                    {cat}
                  </Label>
                ))}
              </LabelGroup>
            </TextInputGroupMain>
            {catalogs.length > 0 && (
              <TextInputGroupUtilities>
                <Button
                  variant="plain"
                  onClick={() => updateFormDataPath('spec.source.catalog.selector', undefined)}
                  aria-label={t('olm-v1~Clear all catalogs')}
                >
                  {t('olm-v1~Clear all')}
                </Button>
              </TextInputGroupUtilities>
            )}
          </TextInputGroup>
          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                {t('olm-v1~Package will only be resolved from specified catalogs.')}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        {error ? <Alert variant="danger" title={error} /> : null}
        <ActionGroup>
          <Button
            type="submit"
            variant="primary"
            isDisabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
          >
            {t('olm-v1~Create')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            {t('olm-v1~Cancel')}
          </Button>
        </ActionGroup>
      </Form>
    </PageSection>
  );
};

export default ClusterExtensionForm;
