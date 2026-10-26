import type { FC } from 'react';
import { EmptyState, EmptyStateVariant, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { ServiceKind } from '../../types';
import { ServerlessFunctionIcon } from '../../utils/icons';
import { useServiceColumns } from '../services/useServiceColumns';
import { CreateActionDropdown } from './CreateActionDropdown';
import { getFunctionDataViewRows } from './FunctionRow';

import './FunctionsPage.scss';

type FunctionsListProps = Omit<
  ConsoleDataViewProps<ServiceKind>,
  'id' | 'columns' | 'getDataViewRows'
>;

export const FunctionsList: FC<FunctionsListProps> = (props) => {
  const { t } = useTranslation('knative-plugin');
  const { ns } = useParams();
  const { columns } = useServiceColumns();
  const emptyState = (
    <EmptyState
      titleText={
        <Title data-test="empty-state-title" headingLevel="h3">
          {t('No functions found')}
        </Title>
      }
      icon={ServerlessFunctionIcon}
      variant={EmptyStateVariant.sm}
    >
      <span>
        {t(
          'Serverless functions are single-purpose, programmatic functions that are hosted on managed infrastructure.',
        )}
      </span>
      <div className="odc-functions__empty-list__dropdown">
        <CreateActionDropdown namespace={ns} />
      </div>
    </EmptyState>
  );
  return props.loaded && !props.loadError && !props.mock && props.data?.length === 0 ? (
    emptyState
  ) : (
    <ConsoleDataView<ServiceKind>
      {...props}
      id="console.ui~v1~KnativeFunctions"
      label={t('Functions')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getFunctionDataViewRows}
    />
  );
};
