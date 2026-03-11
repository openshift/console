import type { Ref } from 'react';
import { useState } from 'react';
import type { MenuToggleElement, SelectProps } from '@patternfly/react-core';
import {
  Button,
  Content,
  ContentVariants,
  Form,
  FormGroup,
  MenuToggle,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Select,
  SelectOption,
  SelectList,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import type { CreateProjectModalProps } from '@console/dynamic-plugin-sdk/src';
import type { ModalComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/ModalProvider';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';
import { resourceObjPath } from '@console/internal/components/utils/resource-link';
import { SelectorInput } from '@console/internal/components/utils/selector-input';
import { NamespaceModel, NetworkPolicyModel } from '@console/internal/models';
import { k8sCreate, referenceFor } from '@console/internal/module/k8s';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

const allow = 'allow';
const deny = 'deny';

const defaultDeny = {
  apiVersion: 'networking.k8s.io/v1',
  kind: 'NetworkPolicy',
  spec: {
    podSelector: null,
  },
};

export const CreateNamespaceModal: ModalComponent<CreateProjectModalProps> = ({
  closeModal,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [inProgress, setInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [networkPolicy, setNetworkPolicy] = useState(allow);
  const [name, setName] = useState('');
  const [labels, setLabels] = useState([]);

  const thenPromise = (res) => {
    setInProgress(false);
    setErrorMessage('');
    return res;
  };

  const catchError = (error) => {
    const err = error.message || t('console-shared~An error occurred. Please try again.');
    setInProgress(false);
    setErrorMessage(err);
    return Promise.reject(err);
  };

  const handlePromise = (promise) => {
    setInProgress(true);

    return promise.then(
      (res) => thenPromise(res),
      (error) => catchError(error),
    );
  };

  const createNamespace = () => {
    const namespace = {
      metadata: {
        name,
        labels: { ...SelectorInput.objectify(labels) },
      },
    };
    return k8sCreate(NamespaceModel, namespace);
  };

  const create = async () => {
    const namespace = await createNamespace();
    if (networkPolicy === deny) {
      const policy = Object.assign({}, defaultDeny, {
        metadata: { namespace: name, name: 'default-deny' },
      });
      await k8sCreate(NetworkPolicyModel, policy);
    }
    return namespace;
  };

  const submit = (event) => {
    event.preventDefault();
    handlePromise(create())
      .then((obj) => {
        closeModal();
        if (onSubmit) {
          onSubmit(obj);
        } else {
          navigate(resourceObjPath(obj, referenceFor(obj)));
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`Failed to create Namespace:`, err);
      });
  };

  const defaultNetworkPolicies = [
    {
      key: 'allow',
      value: t('console-shared~No restrictions'),
    },
    {
      key: 'deny',
      value: t('console-shared~Deny all inbound traffic'),
    },
  ];

  const selectOptions = defaultNetworkPolicies.map((option) => (
    <SelectOption key={option.key} value={option.value}>
      {option.value}
    </SelectOption>
  ));

  const [isOpen, setIsOpen] = useState(false);
  const defaultNetworkPolicy = defaultNetworkPolicies[0].value;
  const [selected, setSelected] = useState<string>(defaultNetworkPolicy);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect: SelectProps['onSelect'] = (_e, value) => {
    setIsOpen(!isOpen);
    setSelected(value as string);
    if (value === defaultNetworkPolicy) {
      setNetworkPolicy(allow);
    } else {
      setNetworkPolicy(deny);
    }
  };

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen}>
      {selected}
    </MenuToggle>
  );

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen
      onClose={closeModal}
      aria-labelledby="create-namespace-modal-title"
    >
      <ModalHeader
        title={t('console-shared~Create Namespace')}
        labelId="create-namespace-modal-title"
      />
      <ModalBody>
        <Form onSubmit={submit} id="create-namespace-form">
          <FormGroup
            label={t('console-shared~Name')}
            isRequired
            fieldId="input-name"
            labelHelp={
              <FieldLevelHelp>
                <Content component={ContentVariants.p}>
                  {t(
                    "console-shared~A Namespace name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name' or '123-abc').",
                  )}
                </Content>
                <Content component={ContentVariants.p}>
                  {t(
                    "console-shared~You must create a Namespace to be able to create projects that begin with 'openshift-', 'kubernetes-', or 'kube-'.",
                  )}
                </Content>
              </FieldLevelHelp>
            }
          >
            <TextInput
              id="input-name"
              data-test="input-name"
              name="name"
              type="text"
              onChange={(_event, value) => setName(value)}
              value={name}
              isRequired
            />
          </FormGroup>
          <FormGroup label={t('console-shared~Labels')}>
            <SelectorInput
              labelClassName="co-m-namespace"
              onChange={(value) => setLabels(value)}
              tags={labels}
            />
          </FormGroup>
          <FormGroup
            label={t('console-shared~Default network policy')}
            fieldId="network-policy-select"
          >
            <Select
              id="network-policy-select"
              isOpen={isOpen}
              selected={selected}
              onSelect={onSelect}
              onOpenChange={() => setIsOpen(isOpen)}
              toggle={toggle}
              shouldFocusToggleOnSelect
            >
              <SelectList>{selectOptions}</SelectList>
            </Select>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={errorMessage}>
        <Button
          type="submit"
          variant="primary"
          isDisabled={inProgress}
          isLoading={inProgress}
          form="create-namespace-form"
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('console-shared~Create')}
        </Button>
        <Button
          type="button"
          variant="link"
          isDisabled={inProgress}
          onClick={closeModal}
          data-test-id="modal-cancel-action"
        >
          {t('console-shared~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </Modal>
  );
};
