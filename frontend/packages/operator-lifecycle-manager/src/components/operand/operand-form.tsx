import * as React from 'react';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import {
  APIServiceDefinition,
  ClusterServiceVersionKind,
  CRDDescription,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import {
  history,
  resourcePathFromModel,
  useScrollToTopOnMount,
} from '@console/internal/components/utils';
import { k8sCreate, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { usePostFormSubmitAction } from '@console/shared';
import { DynamicForm } from '@console/shared/src/components/dynamic-form';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionLogo } from '../index';
import { getUISchema } from './utils';

export const OperandForm: React.FC<OperandFormProps> = ({
  csv,
  formData,
  match,
  model,
  next,
  onChange,
  providedAPI,
  prune,
  schema,
}) => {
  const [errors, setErrors] = React.useState<string[]>([]);
  const postFormCallback = usePostFormSubmitAction<K8sResourceKind>();
  const processFormData = ({ metadata, ...rest }) => {
    const data = {
      metadata: {
        ...metadata,
        ...(match?.params?.ns && model.namespaced && { namespace: match.params.ns }),
      },
      ...rest,
    };
    return prune?.(data) ?? data;
  };

  const handleSubmit = ({ formData: submitFormData }) => {
    k8sCreate(model, processFormData(submitFormData))
      .then((res) => postFormCallback(res))
      .then(() => next && history.push(next))
      .catch((e) => setErrors([e.message]));
  };

  const handleCancel = () => {
    if (new URLSearchParams(window.location.search).has('useInitializationResource')) {
      history.replace(
        resourcePathFromModel(
          ClusterServiceVersionModel,
          csv.metadata.name,
          csv.metadata.namespace,
        ),
      );
    } else {
      history.goBack();
    }
  };

  const uiSchema = React.useMemo(() => getUISchema(schema, providedAPI), [schema, providedAPI]);

  useScrollToTopOnMount();

  return (
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-md-4 col-md-push-8 col-lg-5 col-lg-push-7">
          {csv && providedAPI && (
            <div style={{ marginBottom: '30px' }}>
              <ClusterServiceVersionLogo
                displayName={providedAPI.displayName}
                icon={_.get(csv, 'spec.icon[0]')}
                provider={_.get(csv, 'spec.provider')}
              />
              <SyncMarkdownView content={providedAPI.description} />
            </div>
          )}
        </div>
        <div className="col-md-8 col-md-pull-4 col-lg-7 col-lg-pull-5 co-create-operand__form--toggle-no-border">
          <DynamicForm
            noValidate
            errors={errors}
            formContext={{ namespace: match.params.ns }}
            uiSchema={uiSchema}
            formData={formData}
            onChange={onChange}
            onError={setErrors}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            schema={schema}
          />
        </div>
      </div>
    </div>
  );
};

type ProvidedAPI = CRDDescription | APIServiceDefinition;

export type OperandFormProps = {
  formData?: K8sResourceKind;
  onChange?: (formData?: any) => void;
  match: { params: { ns: string } };
  next?: string;
  csv: ClusterServiceVersionKind;
  model: K8sKind;
  providedAPI: ProvidedAPI;
  prune?: (data: any) => any;
  schema: JSONSchema7;
};
