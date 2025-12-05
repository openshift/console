import * as React from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { useParams } from 'react-router-dom-v5-compat';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import {
  history,
  resourcePathFromModel,
  useScrollToTopOnMount,
} from '@console/internal/components/utils';
import { k8sCreate, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { DynamicForm } from '@console/shared/src/components/dynamic-form';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { useResourceConnectionHandler } from '@console/shared/src/hooks/useResourceConnectionHandler';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind, CRDDescription, APIServiceDefinition } from '../../types';
import { ClusterServiceVersionLogo } from '../cluster-service-version-logo';
import { getUISchema } from './utils';

export const OperandForm: React.FC<OperandFormProps> = ({
  csv,
  formData,
  model,
  next,
  onChange,
  providedAPI,
  prune,
  schema,
}) => {
  const [errors, setErrors] = React.useState<string[]>([]);
  const params = useParams();
  const postFormCallback = useResourceConnectionHandler();
  const processFormData = ({ metadata, ...rest }) => {
    const data = {
      metadata: {
        ...metadata,
        ...(params?.ns && model.namespaced && { namespace: params.ns }),
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
    <PaneBody>
      <Grid hasGutter>
        <GridItem md={4} lg={5} order={{ default: '0', lg: '1' }}>
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
        </GridItem>
        <GridItem md={8} lg={7} order={{ default: '1', lg: '0' }}>
          <DynamicForm
            noValidate
            errors={errors}
            formContext={{ namespace: params.ns }}
            uiSchema={uiSchema}
            formData={formData}
            onChange={onChange}
            onError={setErrors}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            schema={schema}
          />
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

type ProvidedAPI = CRDDescription | APIServiceDefinition;

export type OperandFormProps = {
  formData?: K8sResourceKind;
  onChange?: (formData?: any) => void;
  next?: string;
  csv: ClusterServiceVersionKind;
  model: K8sKind;
  providedAPI: ProvidedAPI;
  prune?: (data: any) => any;
  schema: JSONSchema7;
};
