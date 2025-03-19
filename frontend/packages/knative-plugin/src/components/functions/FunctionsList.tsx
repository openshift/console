import * as React from 'react';
import { EmptyState, EmptyStateVariant, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { Table, TableProps } from '@console/internal/components/factory';
import { ServerlessFunctionIcon } from '../../utils/icons';
import ServiceHeader from '../services/ServiceHeader';
import { CreateActionDropdown } from './CreateActionDropdown';
import FunctionRow from './FunctionRow';

import './FunctionsPage.scss';

const FunctionsList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  const { ns } = useParams();
  const EmptyMsg = () => (
    <EmptyState
      titleText={
        <Title data-test="empty-state-title" headingLevel="h3">
          {t('knative-plugin~No functions found')}
        </Title>
      }
      icon={ServerlessFunctionIcon}
      variant={EmptyStateVariant.sm}
    >
      <span>
        {t(
          'knative-plugin~Serverless functions are single-purpose, programmatic functions that are hosted on managed infrastructure.',
        )}
      </span>
      <div className="odc-functions__empty-list__dropdown">
        <CreateActionDropdown namespace={ns} />
      </div>
    </EmptyState>
  );
  return (
    <Table
      {...props}
      aria-label={t('knative-plugin~Functions')}
      Header={ServiceHeader(t)}
      Row={FunctionRow}
      virtualize
      EmptyMsg={EmptyMsg}
    />
  );
};

export default FunctionsList;
