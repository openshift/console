import * as React from 'react';
import { Alert, Button, Modal, ModalVariant, Text } from '@patternfly/react-core';
import * as _ from 'lodash';
import { resourceListPathFromModel } from '@console/internal/components/utils';
import { history } from '@console/internal/components/utils/router';
import { ResourceDeleteModalProps } from '../../../extensions/console-types';
import { k8sDeleteResource } from '../../../utils/k8s/k8s-resource';

const ResourceDeleteModal = (props: ResourceDeleteModalProps) => {
  const { kind, resource, btnText, isOpen, onClose } = props;
  const [error, setError] = React.useState<string>(null);

  const submit = (event) => {
    event.preventDefault();
    k8sDeleteResource({ model: kind, resource })
      .then(() => {
        const url = resourceListPathFromModel(kind, _.get(resource, 'metadata.namespace'));
        onClose();
        history.push(url);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <Modal
      variant={ModalVariant.default}
      title={`Delete ${kind}?`}
      isOpen={isOpen}
      onClose={onClose}
      titleIconVariant="warning"
      actions={[
        <Button key="delete" variant="danger" onClick={submit}>
          {btnText || 'Delete'}
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>,
      ]}
    >
      <Text>
        Are you sure you want to delete{' '}
        <strong className="co-break-word">{{ resourceName: resource.metadata.name }}</strong>?
      </Text>
      {error && (
        <Alert
          isInline
          className="co-alert co-alert--scrollable"
          variant="danger"
          title="public~An error occurred"
        >
          <div className="co-pre-line">{error}</div>
        </Alert>
      )}
    </Modal>
  );
};

export default ResourceDeleteModal;
