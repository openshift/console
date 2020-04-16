import { JSONSchema6 } from 'json-schema';
import { k8sCreate, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { history, useScrollToTopOnMount } from '@console/internal/components/utils';
import * as _ from 'lodash';
import * as React from 'react';
import { ClusterServiceVersionKind, CRDDescription, APIServiceDefinition } from '../../types';
import { ClusterServiceVersionLogo } from '../index';
import { DynamicForm } from '@console/shared/src/components/dynamic-form';
import { getUISchema } from './utils';
import { prune } from '@console/shared';

export const OperandForm: React.FC<OperandFormProps> = ({
  csv,
  initialData,
  match,
  model,
  next,
  onChange,
  providedAPI,
  schema,
}) => {
  const [errors, setErrors] = React.useState<string[]>([]);
  // const [formData, setFormData] = React.useState(initialData);

  const processFormData = ({ metadata, spec, ...rest }) => {
    return {
      metadata: {
        ...metadata,
        ...(match?.params?.ns && { namespace: match.params.ns }),
      },
      spec: prune(spec),
      ...rest,
    };
  };

  const handleSubmit = ({ formData }) => {
    k8sCreate(model, processFormData(formData))
      .then(() => next && history.push(next))
      .catch((e) => setErrors([e.message]));
  };

  const uiSchema = React.useMemo(() => getUISchema(schema, providedAPI), [schema, providedAPI]);

  useScrollToTopOnMount();

  return (
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-md-8 col-lg-7">
          <DynamicForm
            noValidate
            errors={errors}
            formContext={{ namespace: match.params.ns }}
            uiSchema={uiSchema}
            formData={initialData}
            onChange={onChange}
            onError={setErrors}
            onSubmit={handleSubmit}
            schema={schema}
          />
        </div>
        <div className="col-md-4 col-lg-5">
          {csv && providedAPI && (
            <div style={{ marginBottom: '30px' }}>
              <ClusterServiceVersionLogo
                displayName={providedAPI.displayName}
                icon={_.get(csv, 'spec.icon[0]')}
                provider={_.get(csv, 'spec.provider')}
              />
              {providedAPI.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type ProvidedAPI = CRDDescription | APIServiceDefinition;

export type OperandFormProps = {
  initialData?: K8sResourceKind;
  onChange?: (formData?: any) => void;
  match: { params: { ns: string } };
  next?: string;
  csv: ClusterServiceVersionKind;
  model: K8sKind;
  providedAPI: ProvidedAPI;
  schema: JSONSchema6;
};
