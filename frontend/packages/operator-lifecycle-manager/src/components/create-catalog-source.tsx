import type { FormEvent, ChangeEvent } from 'react';
import { useState, useCallback } from 'react';
import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import type { RadioGroupItems } from '@console/internal/components/radio';
import { RadioGroup } from '@console/internal/components/radio';
import { ButtonBar, NsDropdown } from '@console/internal/components/utils';
import { k8sCreate } from '@console/internal/module/k8s';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { CatalogSourceModel } from '../models';

enum AvailabilityValue {
  ALL_NAMESPACES = '0',
  SINGLE_NAMESPACE = '1',
}

export const CreateCatalogSource = () => {
  const navigate = useNavigate();
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [availability, setAvailability] = useState(AvailabilityValue.ALL_NAMESPACES);
  const [image, setImage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('');
  const [publisher, setPublisher] = useState('');
  const onSave = useCallback(
    (e: FormEvent<EventTarget>) => {
      e.preventDefault();
      return handlePromise(
        k8sCreate(CatalogSourceModel, {
          apiVersion: `${CatalogSourceModel.apiGroup}/${CatalogSourceModel.apiVersion}`,
          kind: CatalogSourceModel.kind,
          metadata: {
            name,
            namespace:
              availability === AvailabilityValue.ALL_NAMESPACES
                ? 'openshift-marketplace'
                : namespace,
          },
          spec: {
            displayName,
            image,
            publisher,
            sourceType: 'grpc',
          },
        }),
      ).then(() => {
        navigate(-1);
      });
    },
    [availability, displayName, handlePromise, image, name, namespace, publisher, navigate],
  );

  const onNamespaceChange = useCallback((value: string) => {
    setNamespace(value);
  }, []);

  const onAvailabiltiyChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setAvailability(value as AvailabilityValue);
  };

  const { t } = useTranslation();
  const availabilityKinds: RadioGroupItems = [
    {
      name: 'catalog-source-availability',
      value: AvailabilityValue.ALL_NAMESPACES,
      label: t('olm~Cluster-wide CatalogSource'),
      description: t('olm~Catalog will be available in all namespaces'),
    },
    {
      name: 'catalog-source-availability',
      value: AvailabilityValue.SINGLE_NAMESPACE,
      label: t('olm~Namespaced CatalogSource'),
      description: t('olm~Catalog will only be available in a single namespace'),
    },
  ];

  const title = t('olm~Create CatalogSource');
  return (
    <div className="co-m-pane__form">
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading
        title={title}
        helpText={t(
          'olm~Create a CatalogSource in order to make operators available in Software Catalog.',
        )}
      />
      <PaneBody>
        <Form onSubmit={onSave}>
          <FormGroup fieldId="catalog-source-name" isRequired label={t('olm~CatalogSource name')}>
            <TextInput
              id="catalog-source-name"
              isRequired
              name="catalog-source-name"
              onChange={(_event, value) => setName(value)}
              placeholder={t('olm~e.g. custom-catalog-source')}
              type="text"
              value={name}
              data-test="catalog-source-name"
            />
          </FormGroup>
          <FormGroup fieldId="catalog-source-display-name" label={t('olm~Display name')}>
            <TextInput
              id="catalog-source-display-name"
              name="caltalog-source-display-name"
              onChange={(_event, value) => setDisplayName(value)}
              placeholder={t('olm~e.g. Custom catalog source')}
              type="text"
              value={displayName}
            />
          </FormGroup>
          <FormGroup fieldId="catalog-source-publisher" label={t('olm~Publisher name')}>
            <TextInput
              id="catalog-source-publisher"
              isRequired
              name="catalog-source-publisher"
              onChange={(_event, value) => setPublisher(value)}
              placeholder={t('olm~e.g. John Doe')}
              type="text"
              value={publisher}
            />
          </FormGroup>
          <FormGroup
            label={t('olm~Image (URL of container image)')}
            isRequired
            fieldId="catalog-source-image"
          >
            <TextInput
              aria-describedby="catalog-source-image-helper"
              isRequired
              type="text"
              id="catalog-source-image"
              name="catalog-source-image"
              onChange={(_event, value) => setImage(value)}
              placeholder={t('olm~e.g. quay.io/johndoe/catalog-registry:latest')}
              value={image}
              data-test="catalog-source-image"
            />

            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t('olm~URL of container image hosted on a registry.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <FormGroup fieldId="catalog-source-availability" label={t('olm~Availability')}>
            <RadioGroup
              currentValue={availability}
              items={availabilityKinds}
              onChange={onAvailabiltiyChange}
            />
          </FormGroup>
          {availability === AvailabilityValue.SINGLE_NAMESPACE && (
            <FormGroup fieldId="catalog-source-namespace" label={t('olm~Namespace')} isRequired>
              <NsDropdown
                selectedKey={namespace}
                onChange={onNamespaceChange}
                id="catalog-source-namespace"
              />
            </FormGroup>
          )}
          <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
            <ActionGroup className="pf-v6-c-form__group--no-top-margin">
              <Button type="submit" variant="primary" id="save-changes" data-test="save-changes">
                {t('olm~Create')}
              </Button>
              <Button type="button" variant="secondary" id="cancel" onClick={handleCancel}>
                {t('olm~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </Form>
      </PaneBody>
    </div>
  );
};
