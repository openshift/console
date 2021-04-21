import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormikValues, useField, useFormikContext } from 'formik';
import { ButtonVariant, Button, Tooltip } from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import LifecycleHookForm from './LifecycleHookForm';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getStrategyData } from '../../utils/edit-deployment-utils';
import './LifecycleHookField.scss';

const LifecycleHookField: React.FC<{
  lifecycleHookName: string;
  resourceObj: K8sResourceKind;
  dataAttribute: string;
  title?: string;
  subTitle?: string;
}> = ({ title, subTitle, dataAttribute, lifecycleHookName, resourceObj }) => {
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
  } = useFormikContext<FormikValues>();
  const [{ value: lifecycleHookExist }] = useField<boolean>(
    `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}.exists`,
  );
  const [showForm, setShowForm] = React.useState(false);

  const onRemove = () => {
    const strategy = deploymentStrategy;
    strategy[dataAttribute][lifecycleHookName] = undefined;
    const data = getStrategyData(
      strategy.type,
      { [dataAttribute]: strategy[dataAttribute] },
      resName,
      resNamespace,
    );
    setFieldValue(
      `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}`,
      data[dataAttribute][lifecycleHookName],
    );
    setFieldValue(
      `formData.deploymentStrategy.imageStreamData.${lifecycleHookName}`,
      data.imageStreamData[lifecycleHookName],
    );
  };
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
          onSubmit={() => {
            setFieldValue(
              `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}.exists`,
              true,
            );
            setFieldValue(
              `formData.deploymentStrategy.${dataAttribute}.${lifecycleHookName}.isAddingLch`,
              false,
            );
            setShowForm(false);
          }}
          onClose={() => {
            setShowForm(false);
            onRemove();
          }}
        />
      )}
    </div>
  );
};

export default LifecycleHookField;
