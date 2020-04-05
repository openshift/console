import * as React from 'react';
import { connect } from 'react-redux';
import { getNamespace, createLookup, getName } from '@console/shared';
import {
  Firehose,
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
  useAccessReview,
  asAccessReview,
  FirehoseResult,
} from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { DataVolumeModel } from '../../models';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import {
  VMTemplateResourceSummary,
  VMTemplateDetailsList,
  VMTemplateSchedulingList,
} from './vm-template-resource';

const VMTemplateDetailsFirehose: React.FC<VMTemplateDetailsFirehoseProps> = (props) => {
  const { obj: template, hasDataVolumes } = props;
  const namespace = getNamespace(template);

  const resources = [
    {
      kind: DataVolumeModel.kind,
      isList: true,
      namespace,
      prop: 'dataVolumes',
      optional: true,
    },
  ];

  const otherProps = { template };

  return (
    <div className="co-m-pane__body">
      {hasDataVolumes ? (
        <Firehose resources={resources}>
          <VMTemplateDetails {...otherProps} />
        </Firehose>
      ) : (
        <VMTemplateDetails {...otherProps} hasDataVolumes={hasDataVolumes} />
      )}
    </div>
  );
};

const stateToProps = ({ k8s }) => {
  return {
    hasDataVolumes: !!k8s.getIn(['RESOURCES', 'models', DataVolumeModel.kind]),
  };
};

export const VMTemplateDetailsConnected = connect(stateToProps)(VMTemplateDetailsFirehose);

const VMTemplateDetails: React.FC<VMTemplateDetailsProps> = (props) => {
  const { template, dataVolumes, ...restProps } = props;
  const loaded = props.loaded || !props.hasDataVolumes;

  const canUpdate = useAccessReview(asAccessReview(TemplateModel, template, 'patch'));

  return (
    <StatusBox data={template} {...restProps} loaded={loaded}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text="VM Template Details" />
        <div className="row">
          <div className="col-sm-6">
            <VMTemplateResourceSummary template={template} canUpdateTemplate={canUpdate} />
          </div>
          <div className="col-sm-6">
            <VMTemplateDetailsList
              template={template}
              dataVolumeLookup={createLookup(dataVolumes, getName)}
              canUpdateTemplate={canUpdate}
            />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Scheduling and resources requirements" />
        <div className="row">
          <VMTemplateSchedulingList template={template} canUpdateTemplate={canUpdate} />
        </div>
      </div>
    </StatusBox>
  );
};

type VMTemplateDetailsProps = {
  template: TemplateKind;
  dataVolumes?: FirehoseResult<V1alpha1DataVolume[]>;
  loaded?: boolean;
  hasDataVolumes?: boolean;
};

type VMTemplateDetailsFirehoseProps = {
  obj: TemplateKind;
  hasDataVolumes: boolean;
};
