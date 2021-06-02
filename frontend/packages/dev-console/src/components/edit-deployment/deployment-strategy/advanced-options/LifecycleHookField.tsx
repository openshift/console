import * as React from 'react';
import { ButtonVariant, Button, Tooltip } from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import { FormikValues, useField, useFormikContext } from 'formik';
import { cloneDeep } from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getResourcesType } from '../../../edit-application/edit-application-utils';
import { getStrategyData } from '../../utils/edit-deployment-utils';
import LifecycleHookForm from './LifecycleHookForm';
import './LifecycleHookField.scss';

interface LifecycleHookFieldProps {
  lifecycleHookName: string;
  resourceObj: K8sResourceKind;
  dataAttribute: string;
  title?: string;
  subTitle?: string;
}

const LifecycleHookField: React.FC<LifecycleHookFieldProps> = ({
  title,
  subTitle,
  dataAttribute,
  lifecycleHookName,
  resourceObj,
}) => {
  const { t } = useTranslation();
  const {
    setFieldValue,
    values: {
      formData: {
        name: resName,
        project: { name: resNamespace },
        deploymentStrategy,
      },
    },
    initialValues,
  } = useFormikContext<FormikValues>();
  const [{ value: lifecycleHookExist }] = useField<boolean>(
    `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}.exists`,
  );
  const [showForm, setShowForm] = React.useState(false);
  const resourceType = getResourcesType(resourceObj);

  const onSubmit = React.useCallback(() => {
    setShowForm(false);
    setFieldValue(`formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}.exists`, true);
    setFieldValue(
      `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}.isAddingLch`,
      false,
    );
    initialValues.formData.deploymentStrategy[dataAttribute][lifecycleHookName] =
      deploymentStrategy[dataAttribute][lifecycleHookName];
    initialValues.formData.deploymentStrategy.imageStreamData[lifecycleHookName] =
      deploymentStrategy.imageStreamData[lifecycleHookName];
  }, [
    dataAttribute,
    deploymentStrategy,
    initialValues.formData.deploymentStrategy,
    lifecycleHookName,
    setFieldValue,
  ]);

  const onRemove = React.useCallback(() => {
    const strategy = cloneDeep(deploymentStrategy);
    strategy[dataAttribute][lifecycleHookName] = undefined;
    const data = getStrategyData(
      strategy.type,
      { [dataAttribute]: strategy[dataAttribute] },
      resName,
      resNamespace,
      resourceType,
    );
    initialValues.formData.deploymentStrategy[dataAttribute][lifecycleHookName] =
      data[dataAttribute][lifecycleHookName];
    initialValues.formData.deploymentStrategy.imageStreamData[lifecycleHookName] =
      data.imageStreamData[lifecycleHookName];
    setFieldValue(
      `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}`,
      data[dataAttribute][lifecycleHookName],
    );
    setFieldValue(
      `formData.deploymentStrategy.imageStreamData.${lifecycleHookName}`,
      data.imageStreamData[lifecycleHookName],
    );
  }, [
    dataAttribute,
    deploymentStrategy,
    initialValues.formData.deploymentStrategy,
    lifecycleHookName,
    resName,
    resNamespace,
    resourceType,
    setFieldValue,
  ]);

  const onClose = React.useCallback(() => {
    setShowForm(false);
    setFieldValue(
      `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}`,
      initialValues.formData.deploymentStrategy[dataAttribute][lifecycleHookName],
    );
    setFieldValue(
      `formData.deploymentStrategy.imageStreamData.${lifecycleHookName}`,
      initialValues.formData.deploymentStrategy.imageStreamData[lifecycleHookName],
    );
    setFieldValue(
      `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}.exists`,
      lifecycleHookExist,
    );
    setFieldValue(
      `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}.isAddingLch`,
      false,
    );
  }, [
    dataAttribute,
    initialValues.formData.deploymentStrategy,
    lifecycleHookExist,
    lifecycleHookName,
    setFieldValue,
  ]);

  return (
    <div>
      <div className="co-section-heading-tertiary odc-lifecycle-hook-field__title">{title}</div>
      <div className="pf-c-form__helper-text">{subTitle}</div>
      {!showForm && (
        <Button
          className="pf-m-link--align-left"
          variant={ButtonVariant.link}
          onClick={() => {
            setShowForm(true);
            setFieldValue(
              `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}.isAddingLch`,
              true,
            );
          }}
          icon={!lifecycleHookExist && <PlusCircleIcon />}
        >
          {`${lifecycleHookExist ? t('devconsole~Edit') : t('devconsole~Add')} ${t(
            'devconsole~{{lifecycleHookName}} lifecycle hook',
            {
              lifecycleHookName,
            },
          )}`}
        </Button>
      )}
      {!showForm && lifecycleHookExist && (
        <Tooltip content={t('devconsole~Remove')} position="right">
          <Button
            className="pf-m-plain--align-left"
            variant={ButtonVariant.plain}
            onClick={onRemove}
          >
            <MinusCircleIcon />
          </Button>
        </Tooltip>
      )}
      {showForm && (
        <LifecycleHookForm
          dataAttribute={dataAttribute}
          resourceObj={resourceObj}
          lifecycleHook={lifecycleHookName}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      )}
    </div>
  );
};

export default LifecycleHookField;
