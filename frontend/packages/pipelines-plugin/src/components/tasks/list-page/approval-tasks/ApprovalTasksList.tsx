import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Table } from '@console/internal/components/factory';
import { ApprovalTaskModel } from '../../../../models';
import { ApprovalTaskKind } from '../../../../types';
import ApprovalHeader from './ApprovalHeader';
import ApprovalRow from './ApprovalRow';

import './ApprovalRow.scss';

type ApprovalTasksListProps = {
  namespace: string;
  loaded?: boolean;
  data?: ApprovalTaskKind[];
  customData?: any;
};

const ApprovalTasksList: React.FC<ApprovalTasksListProps> = (props) => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~Approvals')}</title>
      </Helmet>
      <div className="odc-table-overflow">
        <Table
          {...props}
          aria-label={t(ApprovalTaskModel.labelPluralKey)}
          Header={ApprovalHeader}
          Row={ApprovalRow}
          virtualize
          customData={props.customData}
        />
      </div>
    </>
  );
};

export default ApprovalTasksList;
