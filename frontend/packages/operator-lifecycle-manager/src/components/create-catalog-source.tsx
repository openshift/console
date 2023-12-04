import * as React from 'react';
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
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RadioGroup } from '@console/internal/components/radio';
import {
  ButtonBar,
  history,
  NsDropdown,
  PageHeading,
  withHandlePromise,
} from '@console/internal/components/utils';
import { k8sCreate } from '@console/internal/module/k8s';
import { CatalogSourceModel } from '../models';

enum AvailabilityValue {
  ALL_NAMESPACES = '0',
  SINGLE_NAMESPACE = '1',
}

export const CreateCatalogSource: React.FC = withHandlePromise(
  ({ handlePromise, inProgress, errorMessage }) => {
    const [availability, setAvailability] = React.useState(AvailabilityValue.ALL_NAMESPACES);
    const [image, setImage] = React.useState('');
    const [displayName, setDisplayName] = React.useState('');
    const [name, setName] = React.useState('');
    const [namespace, setNamespace] = React.useState('');
    const [publisher, setPublisher] = React.useState('');
    const onSave = React.useCallback(
      (e: React.FormEvent<EventTarget>) => {
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
          () => history.goBack(),
        );
      },
      [availability, displayName, handlePromise, image, name, namespace, publisher],
    );

    const onNamespaceChange = React.useCallback((value: string) => {
      setNamespace(value);
    }, []);

    const onAvailabiltiyChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
      setAvailability(value as AvailabilityValue);
    };

    const { t } = useTranslation();
    const availabilityKinds = [
      {
        value: AvailabilityValue.ALL_NAMESPACES,
        title: t('olm~Cluster-wide CatalogSource'),
        desc: t('olm~Catalog will be available in all namespaces'),
      },
      {
        value: AvailabilityValue.SINGLE_NAMESPACE,
        title: t('olm~Namespaced CatalogSource'),
        desc: t('olm~Catalog will only be available in a single namespace'),
      },
    ];

    const title = t('olm~Create CatalogSource');
    return (
      <div className="co-m-pane__form">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <PageHeading
          title={title}
          helpText={t(
            'olm~Create a CatalogSource in order to make operators available in OperatorHub.',
          )}
        />
        <div className="co-m-pane__body">
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
              <ActionGroup className="pf-v5-c-form__group--no-top-margin">
                <Button type="submit" variant="primary" id="save-changes" data-test="save-changes">
                  {t('olm~Create')}
                </Button>
                <Button type="button" variant="secondary" id="cancel" onClick={history.goBack}>
                  {t('olm~Cancel')}
                </Button>
              </ActionGroup>
            </ButtonBar>
          </Form>
        </div>
      </div>
    );
  },
);
