import * as React from 'react';
import Helmet from 'react-helmet';
import { match } from 'react-router-dom';
import { ActionGroup, Button, Form, FormGroup, TextInput } from '@patternfly/react-core';
import {
  ButtonBar,
  history,
  NsDropdown,
  withHandlePromise,
  HandlePromiseProps,
} from '@console/internal/components/utils';
import { RadioGroup } from '@console/internal/components/radio';
import { k8sCreate } from '@console/internal/module/k8s';
import { CatalogSourceModel } from '../models';

enum AvailabilityValue {
  ALL_NAMESPACES = '0',
  SINGLE_NAMESPACE = '1',
}

const availabilityKinds = [
  {
    value: AvailabilityValue.ALL_NAMESPACES,
    title: 'Cluster-wide catalog source',
    desc: 'Catalog will be available in all namespaces',
  },
  {
    value: AvailabilityValue.SINGLE_NAMESPACE,
    title: 'Namespace catalog source',
    desc: 'Catalog will only be available in a single namespace',
  },
];

export const CreateCatalogSource: React.FC<CreateCatalogSourceProps> = withHandlePromise(
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
        ).then(() => history.goBack());
      },
      [availability, displayName, handlePromise, image, name, namespace, publisher],
    );

    const onNamespaceChange = React.useCallback((value: string) => {
      setNamespace(value);
    }, []);

    const onAvailabiltiyChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
      setAvailability(value as AvailabilityValue);
    };

    return (
      <div className="co-m-pane__body">
        <Helmet>
          <title>Create Catalog Source</title>
        </Helmet>
        <h1 className="co-m-pane__heading">Create Catalog Source</h1>
        <p className="co-m-pane__explanation">
          Create a catalog source in order to make operators available in OperatorHub.
        </p>
        <Form onSubmit={onSave}>
          <FormGroup fieldId="catalog-source-name" isRequired label="Catalog source name">
            <TextInput
              id="catalog-source-name"
              isRequired
              name="catalog-source-name"
              onChange={setName}
              placeholder="e.g. custom-catalog-source"
              type="text"
              value={name}
            />
          </FormGroup>
          <FormGroup fieldId="catalog-source-display-name" label="Display name">
            <TextInput
              id="catalog-source-display-name"
              name="caltalog-source-display-name"
              onChange={setDisplayName}
              placeholder="e.g. Custom Catalog Source"
              type="text"
              value={displayName}
            />
          </FormGroup>
          <FormGroup fieldId="catalog-source-publisher" label="Publisher name">
            <TextInput
              id="catalog-source-publisher"
              isRequired
              name="catalog-source-publisher"
              onChange={setPublisher}
              placeholder="e.g. John Doe"
              type="text"
              value={publisher}
            />
          </FormGroup>
          <FormGroup
            label="Image (URL of container image)"
            isRequired
            fieldId="catalog-source-image"
            helperText="URL of container image hosted on a registry"
          >
            <TextInput
              aria-describedby="catalog-source-image-helper"
              isRequired
              type="text"
              id="catalog-source-image"
              name="catalog-source-image"
              onChange={setImage}
              placeholder="e.g. quay.io/johndoe/catalog-registry:latest"
              value={image}
            />
          </FormGroup>
          <FormGroup fieldId="catalog-source-availability" label="Availability">
            <RadioGroup
              currentValue={availability}
              items={availabilityKinds}
              onChange={onAvailabiltiyChange}
            />
          </FormGroup>
          {availability === AvailabilityValue.SINGLE_NAMESPACE && (
            <FormGroup fieldId="catalog-source-namespace" label="Namespace" isRequired>
              <NsDropdown
                selectedKey={namespace}
                onChange={onNamespaceChange}
                id="catalog-source-namespace"
              />
            </FormGroup>
          )}
          <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
            <ActionGroup className="pf-c-form__group--no-top-margin">
              <Button type="submit" variant="primary" id="save-changes">
                Create
              </Button>
              <Button type="button" variant="secondary" id="cancel" onClick={history.goBack}>
                Cancel
              </Button>
            </ActionGroup>
          </ButtonBar>
        </Form>
      </div>
    );
  },
);

type CreateCatalogSourceProps = HandlePromiseProps & {
  match: match;
};
