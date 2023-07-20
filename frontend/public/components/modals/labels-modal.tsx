import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { K8sResourceKind, k8sPatch, referenceForModel } from '../../module/k8s';
import {
  createModalLauncher,
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
  ModalComponentProps,
} from '../factory/modal';
import { HandlePromiseProps, ResourceIcon, SelectorInput, withHandlePromise } from '../utils';

const LABELS_PATH = '/metadata/labels';
const TEMPLATE_SELECTOR_PATH = '/spec/template/metadata/labels';

const BaseLabelsModal = withHandlePromise<BaseLabelsModalProps & HandlePromiseProps>(
  ({
    cancel,
    close,
    descriptionKey,
    errorMessage,
    handlePromise,
    isPodSelector,
    kind,
    labelClassName,
    messageKey,
    messageVariables,
    path,
    resource,
  }) => {
    const [labels, setLabels] = React.useState(
      SelectorInput.arrayify(_.get(resource, path.split('/').slice(1))),
    );
    const createPath = !labels.length;
    const { t } = useTranslation();

    const submit = (e) => {
      e.preventDefault();
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
      handlePromise(promise, close);
    };

    return (
      <form onSubmit={submit} name="form" className="modal-content">
        <ModalTitle>
          {descriptionKey
            ? t('public~Edit {{description}}', {
                description: t(descriptionKey),
              })
            : t('public~Edit labels')}
        </ModalTitle>
        <ModalBody>
          <div className="row co-m-form-row">
            <div className="col-sm-12">
              {messageKey
                ? t(messageKey, messageVariables)
                : t(
                    'public~Labels help you organize and select resources. Adding labels below will let you query for objects that have similar, overlapping or dissimilar labels.',
                  )}
            </div>
          </div>
          <div className="row co-m-form-row">
            <div className="col-sm-12">
              <label htmlFor="tags-input" className="control-label">
                {descriptionKey
                  ? t('{{description}} for', { description: t(descriptionKey) })
                  : t('public~Labels for')}{' '}
                <ResourceIcon kind={kind.crd ? referenceForModel(kind) : kind.kind} />{' '}
                {resource.metadata.name}
              </label>
              <SelectorInput
                onChange={(l) => setLabels(l)}
                tags={labels}
                labelClassName={labelClassName || `co-m-${kind.id}`}
                autoFocus
              />
            </div>
          </div>
        </ModalBody>
        <ModalSubmitFooter
          errorMessage={errorMessage}
          inProgress={false}
          submitText={t('public~Save')}
          cancel={cancel}
        />
      </form>
    );
  },
);
export const LabelsModal: React.FC<LabelsModalProps> = (props) => (
  <BaseLabelsModal path={LABELS_PATH} {...props} />
);
export const labelsModalLauncher = createModalLauncher<LabelsModalProps>(LabelsModal);

export const podSelectorModal = createModalLauncher<PodSelectorModalProps>((props) => {
  const { t } = useTranslation();
  return (
    <BaseLabelsModal
      path={
        ['replicationcontrolleres', 'services'].includes(props.kind.plural)
          ? '/spec/selector'
          : '/spec/selector/matchLabels'
      }
      isPodSelector={true}
      // t('public~Pod selector')
      descriptionKey="public~Pod selector"
      // t('public~Determines the set of pods targeted by this {{kind}}.')
      messageKey={'public~Determines the set of pods targeted by this {{kind}}.'}
      messageVariables={{
        kind: props.kind.labelKey ? t(props.kind.labelKey) : props.kind.label.toLowerCase(),
      }}
      labelClassName="co-m-pod"
      {...props}
    />
  );
});

type BaseLabelsModalProps = {
  descriptionKey?: string;
  isPodSelector?: boolean;
  kind: K8sModel;
  labelClassName?: string;
  messageKey?: string;
  messageVariables?: { [key: string]: string };
  path: string;
  resource: K8sResourceKind;
} & ModalComponentProps;
export type LabelsModalProps = Omit<BaseLabelsModalProps, 'path'>;
type PodSelectorModalProps = Omit<
  BaseLabelsModalProps,
  'descriptionKey' | 'isPodSelector' | 'labelClassName' | 'messageKey' | 'messageVariables' | 'path'
>;
