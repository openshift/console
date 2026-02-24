import * as _ from 'lodash';
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Modal, ModalBody, ModalHeader } from '@patternfly/react-core';

import { k8sPatch } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { ModalComponentProps } from '../factory/modal';
import { NameValueEditorPair } from '../utils/types';
import { AsyncComponent } from '../utils/async';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';

/**
 * Set up an AsyncComponent to wrap the name-value-editor to allow on demand loading to reduce the
 * vendor footprint size.
 */
const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() => import('../utils/name-value-editor').then((c) => c.NameValueEditor)}
    {...props}
  />
);

export const TagsModal = (props: TagsModalProps) => {
  // Track tags as an array instead of an object / Map so we can preserve the order during editing and so we can have
  // duplicate keys during editing. However, the ordering and any duplicate keys are lost when the form is submitted.
  const [tags, setTags] = useState(_.isEmpty(props.tags) ? [['', '']] : _.toPairs(props.tags));
  const [localErrorMessage, setLocalErrorMessage] = useState('');
  const [handlePromise, inProgress, errorMessage] = usePromiseHandler();
  const [watchedResource, watchedResourceLoaded] = useK8sWatchResource<K8sResourceCommon>({
    kind: props.resource?.kind,
    name: props.resource?.metadata?.name,
    namespace: props.resource?.metadata?.namespace,
  });
  const [stale, setStale] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (watchedResourceLoaded && !_.isEmpty(watchedResource)) {
      setStale(!_.isEqual(props.tags, watchedResource?.metadata?.annotations));
    }
  }, [props.tags, watchedResource, watchedResourceLoaded]);

  const submit = (e): void => {
    e.preventDefault();

    // We just throw away any rows where the key is blank
    const usedTags = _.reject(tags, (tag) => _.isEmpty(tag[NameValueEditorPair.Name]));

    const keys = usedTags.map((tag) => tag[NameValueEditorPair.Name]);
    if (_.uniq(keys).length !== keys.length) {
      setLocalErrorMessage(t('public~Duplicate keys found.'));
      return;
    }
    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = props.tags ? 'replace' : 'add';
    const patch = [{ path: props.path, op, value: _.fromPairs(usedTags) }];

    setLocalErrorMessage('');
    handlePromise(k8sPatch(props.kind, props.resource, patch))
      .then(() => props.close())
      .catch(() => {});
  };

  return (
    <>
      <ModalBody>
        <Form onSubmit={submit} id="tags-modal-form">
          <NameValueEditorComponent
            nameValuePairs={tags}
            submit={submit}
            updateParentData={({ nameValuePairs }) => setTags(nameValuePairs)}
          />
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts
        errorMessage={errorMessage || localErrorMessage}
        message={
          stale
            ? t('public~Annotations have been updated. Click Cancel and reapply your changes.')
            : undefined
        }
      >
        <Button
          type="submit"
          variant="primary"
          isDisabled={stale || inProgress}
          isLoading={inProgress}
          form="tags-modal-form"
          data-test="confirm-action"
          id="confirm-action"
        >
          {t('public~Save')}
        </Button>
        <Button
          type="button"
          variant="link"
          isDisabled={inProgress}
          onClick={props.cancel}
          data-test-id="modal-cancel-action"
        >
          {t('public~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export const AnnotationsModal: FC<AnnotationsModalProps> = (props) => (
  <TagsModal
    path="/metadata/annotations"
    tags={props.resource?.metadata?.annotations}
    // t('public~Edit annotations')
    titleKey="public~Edit annotations"
    {...props}
  />
);

export const AnnotationsModalOverlay: OverlayComponent<AnnotationsModalProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Modal variant="small" isOpen onClose={props.closeOverlay}>
      <ModalHeader title={t('public~Edit annotations')} />
      <AnnotationsModal {...props} cancel={props.closeOverlay} close={props.closeOverlay} />
    </Modal>
  );
};

TagsModal.displayName = 'TagsModal';

export type TagsModalProps = {
  kind: K8sModel;
  path: string;
  resource: K8sResourceCommon;
  tags?: { [key: string]: string };
  titleKey: string;
} & ModalComponentProps;

export type AnnotationsModalProps = Omit<TagsModalProps, 'path' | 'tags' | 'titleKey'>;
