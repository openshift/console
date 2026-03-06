import type { FC } from 'react';
import { useState, useMemo } from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import type { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { resourcePathFromModel, useScrollToTopOnMount } from '@console/internal/components/utils';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { k8sCreate } from '@console/internal/module/k8s';
import { DynamicForm } from '@console/shared/src/components/dynamic-form';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { useResourceConnectionHandler } from '@console/shared/src/hooks/useResourceConnectionHandler';
import { ClusterServiceVersionModel } from '../../models';
import type { ClusterServiceVersionKind, CRDDescription, APIServiceDefinition } from '../../types';
import { ClusterServiceVersionLogo } from '../cluster-service-version-logo';
import { getUISchema } from './utils';

export const OperandForm: FC<OperandFormProps> = ({
  csv,
  formData,
  model,
  next,
  onChange,
  providedAPI,
  prune,
  schema,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const params = useParams();
  const navigate = useNavigate();
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
      .then(() => next && navigate(next))
      .catch((e) => setErrors([e.message]));
  };

  const handleCancel = () => {
    if (new URLSearchParams(window.location.search).has('useInitializationResource')) {
      navigate(
        resourcePathFromModel(
          ClusterServiceVersionModel,
          csv.metadata.name,
          csv.metadata.namespace,
        ),
        { replace: true },
      );
    } else {
      navigate(-1);
    }
  };

  const uiSchema = useMemo(() => getUISchema(schema, providedAPI), [schema, providedAPI]);

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
