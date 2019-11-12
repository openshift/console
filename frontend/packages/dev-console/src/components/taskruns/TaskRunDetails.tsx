import * as React from 'react';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { TaskRunModel } from '../../models';

export interface TaskRunDetailsProps {
  obj: K8sResourceKind;
}

const TaskRunDetails: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  return (
    <div className="co-m-pane__body">
      <SectionHeading text={`${TaskRunModel.label} Overview`} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={taskRun} />
        </div>
      </div>
    </div>
  );
};

export default TaskRunDetails;
