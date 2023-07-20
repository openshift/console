import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { k8sPatch } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '../factory/modal';
import { NameValueEditorPair } from '../utils/types';
import { withHandlePromise, HandlePromiseProps } from '../utils/promise-component';
import { AsyncComponent } from '../utils/async';

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

export const TagsModal = withHandlePromise<TagsModalProps & HandlePromiseProps>((props) => {
  // Track tags as an array instead of an object / Map so we can preserve the order during editing and so we can have
  // duplicate keys during editing. However, the ordering and any duplicate keys are lost when the form is submitted.
  const [tags, setTags] = React.useState(
    _.isEmpty(props.tags) ? [['', '']] : _.toPairs(props.tags),
  );
  const [errorMessage, setErrorMessage] = React.useState(props.errorMessage);

  const { t } = useTranslation();

  const submit = (e) => {
    e.preventDefault();

    // We just throw away any rows where the key is blank
    const usedTags = _.reject(tags, (tag) => _.isEmpty(tag[NameValueEditorPair.Name]));

    const keys = usedTags.map((tag) => tag[NameValueEditorPair.Name]);
    if (_.uniq(keys).length !== keys.length) {
      setErrorMessage(t('public~Duplicate keys found.'));
      return;
    }
    // Make sure to 'add' if the path does not already exist, otherwise the patch request will fail
    const op = props.tags ? 'replace' : 'add';
    const patch = [{ path: props.path, op, value: _.fromPairs(usedTags) }];
    const promise = k8sPatch(props.kind, props.resource, patch);
    props.handlePromise(promise, props.close);
  };

  return (
    <form onSubmit={submit} className="modal-content">
      <ModalTitle>{t(props.titleKey)}</ModalTitle>
      <ModalBody>
        <NameValueEditorComponent
          nameValuePairs={tags}
          submit={submit}
          updateParentData={({ nameValuePairs }) => setTags(nameValuePairs)}
        />
      </ModalBody>
      <ModalSubmitFooter
        submitText={t('public~Save')}
        cancel={props.cancel}
        errorMessage={props.errorMessage || errorMessage}
        inProgress={props.inProgress}
      />
    </form>
  );
});

export const AnnotationsModal: React.FC<AnnotationsModalProps> = (props) => (
  <TagsModal
    path="/metadata/annotations"
    tags={props.resource.metadata.annotations}
    // t('public~Edit annotations')
    titleKey="public~Edit annotations"
    {...props}
  />
);

export const annotationsModalLauncher = createModalLauncher<AnnotationsModalProps>(
  AnnotationsModal,
);

TagsModal.displayName = 'TagsModal';

export type TagsModalProps = {
  kind: K8sModel;
  path: string;
  resource: K8sResourceCommon;
  tags?: { [key: string]: string };
  titleKey: string;
} & ModalComponentProps;

export type AnnotationsModalProps = Omit<TagsModalProps, 'path' | 'tags' | 'titleKey'>;
