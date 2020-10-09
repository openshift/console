import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { k8sPatch, referenceForModel } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { ResourceIcon, SelectorInput, withHandlePromise } from '../utils';

const LABELS_PATH = '/metadata/labels';
const TEMPLATE_SELECTOR_PATH = '/spec/template/metadata/labels';

const BaseLabelsModal = withHandlePromise((props) => {
  const [labels, setLabels] = React.useState(
    SelectorInput.arrayify(_.get(props.resource, props.path.split('/').slice(1))),
  );
  const [errorMessage] = React.useState();
  const createPath = !labels.length;
  const { t } = useTranslation();

  const submit = (e) => {
    e.preventDefault();

    const { kind, path, resource, isPodSelector } = props;

    const patch = [
      {
        op: createPath ? 'add' : 'replace',
        path,
        value: SelectorInput.objectify(labels),
      },
    ];

    // https://kubernetes.io/docs/user-guide/deployments/#selector
    //   .spec.selector must match .spec.template.metadata.labels, or it will be rejected by the API
    const updateTemplate =
      isPodSelector && !_.isEmpty(_.get(resource, TEMPLATE_SELECTOR_PATH.split('/').slice(1)));

    if (updateTemplate) {
      patch.push({
        path: TEMPLATE_SELECTOR_PATH,
        op: 'replace',
        value: SelectorInput.objectify(labels),
      });
    }
    const promise = k8sPatch(kind, resource, patch);
    props.handlePromise(promise, props.close);
  };

  const { kind, resource, descriptionKey, messageKey, labelClassName } = props;

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle>
        {descriptionKey
          ? t('modal~Edit {{description}}', { description: t(descriptionKey) })
          : t('modal~Edit labels')}
      </ModalTitle>
      <ModalBody>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            {messageKey
              ? t(messageKey)
              : t(
                  'modal~Labels help you organize and select resources. Adding labels below will let you query for objects that have similar, overlapping or dissimilar labels.',
                )}
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label htmlFor="tags-input" className="control-label">
              {descriptionKey
                ? t('{{description}} for', { description: t(descriptionKey) })
                : t('modal~Labels for')}{' '}
              <ResourceIcon kind={kind.crd ? referenceForModel(kind) : kind.kind} />{' '}
              {resource.metadata.name}
            </label>
            <SelectorInput
              onChange={(l) => setLabels(l)}
              tags={labels}
              labelClassName={labelClassName || `co-text-${kind.id}`}
              autoFocus
            />
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMessage}
        inProgress={false}
        submitText={t('modal~Save')}
        cancel={props.cancel}
      />
    </form>
  );
});

export const labelsModal = createModalLauncher((props) => (
  <BaseLabelsModal path={LABELS_PATH} {...props} />
));

export const podSelectorModal = createModalLauncher((props) => (
  <BaseLabelsModal
    path={
      ['replicationcontrolleres', 'services'].includes(props.kind.plural)
        ? '/spec/selector'
        : '/spec/selector/matchLabels'
    }
    isPodSelector={true}
    // t('modal~Pod selector')
    descriptionKey="modal~Pod selector"
    // t('modal~Determines the set of pods targeted by this {{kind: props.kind.label.toLowerCase()}}.')
    messageKey="modal~Determines the set of pods targeted by this {{kind: props.kind.label.toLowerCase()}}."
    labelClassName="co-text-pod"
    {...props}
  />
));
