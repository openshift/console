/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react';
import { ActionGroup, Button, Form, TextInput } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation, WithTranslation } from 'react-i18next';
import {
  ButtonBar,
  history,
  LoadError,
  LoadingBox,
  NsDropdown,
  resourcePath,
} from '@console/internal/components/utils';
import { SecretModel, TemplateInstanceModel } from '@console/internal/models';
import {
  k8sCreate,
  K8sResourceKind,
  TemplateInstanceKind,
  TemplateKind,
  TemplateParameter,
} from '@console/internal/module/k8s';
import { TEMPLATE_PARAM_VM_NAME } from '../../../constants';
import { VirtualMachineModel } from '../../../models';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';
import { FormRow } from '../../form/form-row';
import { TemplateInfo } from './TemplateInfo';

export type TemplateFormProps = {
  obj: {
    data: TemplateKind;
    loaded: boolean;
    loadError: any;
  };
  preselectedNamespace: string;
} & WithTranslation;

export const TemplateForm: React.FC<TemplateFormProps> = ({
  obj,
  preselectedNamespace = 'default',
}) => {
  const { t } = useTranslation();
  const { data, loaded, loadError } = obj;
  const [namespace, setNamespace] = React.useState<string>(preselectedNamespace);

  const [inProgress, setInProgress] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string>('');

  const getParameterValues = () => {
    const templateParameters: TemplateParameter[] = data?.parameters || [];
    return templateParameters?.reduce((acc, { name, value }: TemplateParameter) => {
      acc[name] = value;
      return acc;
    }, {});
  };

  const [parameters, setParameters] = React.useState<{}>(getParameterValues());
  const onParameterChanged = (value, event) => {
    const { id } = event.target;
    setParameters((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const createTemplateSecret = async () => {
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        generateName: `${data.metadata.name}-parameters-`,
        namespace,
      },
      // Remove empty values.
      stringData: parameters,
    };
    return k8sCreate(SecretModel, secret);
  };

  const createTemplateInstance = async (secret: K8sResourceKind) => {
    const instance: TemplateInstanceKind = {
      apiVersion: 'template.openshift.io/v1',
      kind: 'TemplateInstance',
      metadata: {
        generateName: `${data.metadata.name}-`,
        namespace,
      },
      spec: {
        template: data,
        secret: {
          name: secret.metadata.name,
        },
      },
    };
    return k8sCreate(TemplateInstanceModel, instance);
  };

  const missingParams = Object.entries(parameters).filter(
    ([, value]) => !value || _.isEmpty(value),
  );
  const initValues = getParameterValues();
  const save = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    if (!namespace) {
      setErrorMsg('Please complete all fields.');
      return;
    }

    const missingRequiredParams = data.parameters.filter(
      ({ required, name }) =>
        required && missingParams.find(([key, value]) => name === key && !value),
    );
    if (!_.isEmpty(missingRequiredParams)) {
      const missingParamNames = missingRequiredParams
        .map(({ displayName, name }) => displayName || name)
        .join(', ');
      setErrorMsg(`Please fill missing fields ${missingParamNames}`);
      return;
    }

    if (!_.isEmpty(missingParams)) {
      setParameters((prevState) => {
        const missingParamsKeys = missingParams.map(([key]) => key);
        const restoreMissingParams = {};
        missingParamsKeys.forEach((key) => (restoreMissingParams[key] = initValues[key]));
        return {
          ...prevState,
          ...restoreMissingParams,
        };
      });
    }
    setErrorMsg('');
    setInProgress(true);

    createTemplateSecret()
      .then((secret: K8sResourceKind) => createTemplateInstance(secret))
      .then(() => {
        setInProgress(false);
        const url = resourcePath(
          kubevirtReferenceForModel(VirtualMachineModel),
          parameters[TEMPLATE_PARAM_VM_NAME],
          namespace,
        );
        history.push(url);
      })
      .catch((err) => {
        setInProgress(false);
        setErrorMsg(err.message);
      });
  };

  React.useEffect(() => {
    setParameters(getParameterValues());
  }, [obj]);

  if (loadError) {
    return (
      <LoadError
        message={loadError.message}
        label={t('kubevirt-plugin~Template')}
        className="loading-box loading-box__errored"
      />
    );
  }

  if (!loaded) {
    return <LoadingBox />;
  }

  return (
    <div className="row">
      <div className="col-md-7 col-md-push-5">
        <TemplateInfo template={data} />
      </div>
      <div className="col-md-5 col-md-pull-7">
        <Form className="kv-template-form-list" onSubmit={save}>
          <FormRow title={t('kubevirt-plugin~Namespace')} fieldId="namespace-row" isRequired>
            <NsDropdown selectedKey={namespace} onChange={setNamespace} id="namespace" />
          </FormRow>
          {data?.parameters?.map(
            ({
              name,
              displayName,
              description,
              required: requiredParam,
              generate,
            }: TemplateParameter) => {
              const paramValue = parameters[name] || '';
              const helpID = description ? `${name}-help` : '';
              const placeholder = generate
                ? '(generated if empty)'
                : missingParams.find(([key]) => key === name) && !requiredParam
                ? `(set to ${initValues[name]} if empty)`
                : '';
              // Only set required for parameters not generated.
              const requiredInput = requiredParam && !generate;
              return (
                <FormRow
                  title={displayName || name}
                  key={name}
                  fieldId={name}
                  isRequired={requiredInput}
                >
                  <TextInput
                    key={name}
                    isRequired={requiredInput}
                    id={name}
                    value={paramValue}
                    onChange={(val, e) => onParameterChanged(val, e)}
                    placeholder={placeholder}
                  />
                  {description && (
                    <div className="help-block" id={helpID}>
                      {description}
                    </div>
                  )}
                </FormRow>
              );
            },
          )}
          <ButtonBar errorMessage={errorMsg} inProgress={inProgress}>
            <ActionGroup className="pf-c-form">
              <Button type="submit" variant="primary">
                {t('kubevirt-plugin~Create')}
              </Button>
              <Button type="button" variant="secondary" onClick={history.goBack}>
                {t('kubevirt-plugin~Cancel')}
              </Button>
            </ActionGroup>
          </ButtonBar>
        </Form>
      </div>
    </div>
  );
};
