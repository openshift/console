import * as React from 'react';
import { Formik } from 'formik';
import { validationSchema } from './pipelineResource-validation-utils';
import PipelineResourceParam from './PipelineResourceParam';
import { createPipelineResource, createSecretResource } from './pipelineResource-utils';

export interface PipelineResourceFormProps {
  type: string;
  onCreate: Function;
  onClose: Function;
  closeDisabled?: boolean;
  namespace: string;
}

const PipelineResourceForm: React.FC<PipelineResourceFormProps> = ({
  type,
  onCreate,
  onClose,
  namespace,
  closeDisabled,
}) => {
  const initialValues = {
    git: {
      type: 'git',
      params: {
        url: '',
        revision: '',
      },
    },
    image: {
      type: 'image',
      params: {
        url: '',
      },
    },
    storage: {
      type: 'storage',
      params: {
        type: '',
        location: '',
        dir: '',
      },
    },
    cluster: {
      type: 'cluster',
      params: {
        name: '',
        url: '',
        username: '',
        password: '',
        insecure: '',
      },
      secrets: {
        cadata: '',
        token: '',
      },
    },
  };

  const pipelineResourceData = (params, actions, secretResp?) => {
    createPipelineResource(params, type, namespace, secretResp)
      .then((newObj) => {
        actions.setSubmitting(false);
        onCreate(newObj);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  const handleSubmit = ({ params, secrets }, actions) => {
    actions.setSubmitting(true);
    if (!secrets) {
      pipelineResourceData(params, actions);
    } else {
      createSecretResource(secrets, type, namespace)
        .then((secretResp) => {
          pipelineResourceData(params, actions, secretResp);
        })
        .catch((err) => {
          actions.setSubmitting(false);
          actions.setStatus({ submitError: err.message });
        });
    }
  };

  const handleReset = (values, actions) => {
    actions.resetForm({ values: initialValues[type], status: {} });
    onClose();
  };

  return (
    <Formik
      initialValues={initialValues[type]}
      onSubmit={handleSubmit}
      onReset={handleReset}
      validationSchema={validationSchema}
    >
      {(props) => <PipelineResourceParam {...props} type={type} closeDisabled={closeDisabled} />}
    </Formik>
  );
};

export default PipelineResourceForm;
