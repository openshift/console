import { K8sResourceKind } from '@console/internal/module/k8s';
import * as React from 'react';
import { Firehose, FirehoseResource } from '@console/internal/components/utils';
import { ImageStreamModel } from '@console/internal/models';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import EditApplication from './EditApplication';
import { EditApplicationProps } from './edit-application-types';

interface EditApplicationWrapperProps {
  editAppResource: K8sResourceKind;
}

type Props = EditApplicationWrapperProps & ModalComponentProps;

const EditApplicationComponentLoader: React.FunctionComponent<EditApplicationProps> = (
  props: EditApplicationProps,
) => {
  const { loaded } = props;
  return loaded && <EditApplication {...props} />;
};

const EditApplicationWrapper: React.FunctionComponent<Props> = ({
  editAppResource,
  cancel,
  close,
}) => {
  const { name, namespace } = editAppResource.metadata;
  const appResources: FirehoseResource[] = [
    {
      kind: 'Service',
      prop: 'service',
      name,
      namespace,
      optional: true,
    },
    {
      kind: 'BuildConfig',
      prop: 'buildConfig',
      name,
      namespace,
      optional: true,
    },
    {
      kind: 'Route',
      prop: 'route',
      name,
      namespace,
      optional: true,
    },
    {
      kind: ImageStreamModel.kind,
      prop: 'imageStreams',
      isList: true,
      namespace: 'openshift',
      optional: true,
    },
  ];

  return (
    <Firehose resources={appResources}>
      <EditApplicationComponentLoader
        namespace={namespace}
        appName={name}
        editAppResource={editAppResource}
        onCancel={cancel}
        onSubmit={close}
      />
    </Firehose>
  );
};

export const editApplication = createModalLauncher((props: Props) => (
  <EditApplicationWrapper {...props} />
));

export default EditApplicationWrapper;
