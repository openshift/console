import * as React from 'react';

import { ApprovalModel } from '../../models';
import { ApprovalKind, K8sResourceKindReference } from '../../module/k8s';
import { DetailsPage, ListPage, Table, RowFunction } from '../factory';
import { Kebab, navFactory, ResourceSummary, SectionHeading } from '../utils';
import { WorkloadTableRow, WorkloadTableHeader } from '../workload-table';

const approvalsReference: K8sResourceKindReference = 'Approval';
const { common } = Kebab.factory;

export const menuActions = [...Kebab.getExtensionsActionsForKind(ApprovalModel), ...common];
const ApprovalDetails: React.FC<ApprovalDetailsProps> = ({ obj: approval }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Approval Details" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={approval}></ResourceSummary>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
ApprovalDetails.displayName = 'ApprovalDetails';

const { details, editYaml } = navFactory;
export const ApprovalsDetailsPage: React.FC<ApprovalsDetailsPageProps> = props => <DetailsPage {...props} kind={approvalsReference} menuActions={menuActions} pages={[details(ApprovalDetails), editYaml()]} />;
ApprovalsDetailsPage.displayName = 'ApprovalsDetailsPage';

type ApprovalDetailsProps = {
  obj: ApprovalKind;
};

const kind = 'Approval';

const ApprovalTableRow: RowFunction<ApprovalKind> = ({ obj, index, key, style }) => {
  return <WorkloadTableRow obj={obj} index={index} rowKey={key} style={style} menuActions={menuActions} kind={kind} />;
};

const ApprovalTableHeader = () => {
  return WorkloadTableHeader();
};
ApprovalTableHeader.displayName = 'ApprovalTableHeader';

export const ApprovalsList: React.FC = props => <Table {...props} aria-label="Approvals" Header={ApprovalTableHeader} Row={ApprovalTableRow} virtualize />;
ApprovalsList.displayName = 'ApprovalsList';

export const ApprovalsPage: React.FC<ApprovalsPageProps> = props => <ListPage kind={approvalsReference} canCreate={true} ListComponent={ApprovalsList} {...props} />;
ApprovalsPage.displayName = 'ApprovalsPage';

type ApprovalsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type ApprovalsDetailsPageProps = {
  match: any;
};
