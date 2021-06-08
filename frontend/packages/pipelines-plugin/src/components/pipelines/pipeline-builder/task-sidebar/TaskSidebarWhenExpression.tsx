import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { Button, ButtonType, ButtonVariant, Tooltip } from '@patternfly/react-core';
import { useField } from 'formik';
import { MultiColumnField } from '@console/shared';
import { SelectedBuilderTask } from '../types';
import { useBuilderParams } from '../../../shared/common/auto-complete/autoCompleteValueParsers';
import WhenExpressionForm from '../../pipeline-topology/WhenExpressionForm';

import './TaskSidebarWhenExpression.scss';
import { RowRendererProps } from '@console/shared/src/components/formik-fields/multi-column-field/MultiColumnFieldRow';

type TaskSidebarWhenExpressionProps = {
  hasParam: boolean;
  name: string;
  selectedData: SelectedBuilderTask;
};

const TaskSidebarWhenExpression: React.FC<TaskSidebarWhenExpressionProps> = (props) => {
  const { name, selectedData } = props;
  const [field] = useField(name);
  const { t } = useTranslation();
  const removeWhenExpressionLabel = t('pipelines-plugin~Remove when expression');
  const autoCompleteValues: string[] = useBuilderParams(selectedData);

  return (
    <div className="opp-task-sidebar-when-expression">
      <h2>{t('pipelines-plugin~When expressions')}</h2>
      <p className="co-help-text">
        {field.value?.length > 0 ? (
          <Trans ns="pipelines-plugin">
            use this format while referencing the variables in this form: <code>$(</code>
          </Trans>
        ) : (
          t('pipelines-plugin~No when expressions are associated with this task.')
        )}
      </p>
      <MultiColumnField
        data-test="when-expression"
        name={name}
        addLabel={t('pipelines-plugin~Add when expression')}
        headers={[]}
        emptyValues={{ input: '', operator: '', values: [''] }}
        rowRenderer={({ onDelete, fieldName }: RowRendererProps) => (
          <div className="opp-task-sidebar-when-expression__section" data-test={`row ${fieldName}`}>
            <WhenExpressionForm autoCompleteValues={autoCompleteValues} namePrefix={fieldName} />
            <div className="opp-task-sidebar-when-expression__control-button-wrapper">
              <Tooltip content={removeWhenExpressionLabel}>
                <Button
                  onClick={onDelete}
                  data-test="remove-when-expression"
                  className="opp-task-sidebar-when-expression__control-button"
                  aria-label={removeWhenExpressionLabel}
                  variant={ButtonVariant.plain}
                  type={ButtonType.button}
                >
                  <MinusCircleIcon />
                  <span className="opp-task-sidebar-when-expression__control-label">
                    {removeWhenExpressionLabel}
                  </span>
                </Button>
              </Tooltip>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default TaskSidebarWhenExpression;
