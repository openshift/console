import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useFormikValidationFix } from '@console/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import { ProjectModel } from '@console/internal/models';
import CronJobSection from './CronJobSection';
import SinkBindingSection from './SinkBindingSection';
import ApiServerSection from './ApiServerSection';
import ContainerSourceSection from './ContainerSourceSection';
import PingSourceSection from './PingSourceSection';
import KafkaSourceSection from './KafkaSourceSection';
import YAMLEditorSection from './YAMLEditorSection';
import { EventSources } from '../import-types';
import SinkSection from './SinkSection';
import { isKnownEventSource } from '../../../utils/create-eventsources-utils';

interface EventSourceSectionProps {
  namespace: string;
}

const EventSourceSection: React.FC<EventSourceSectionProps> = ({ namespace }) => {
  const { values } = useFormikContext<FormikValues>();
  const projectResource = { kind: ProjectModel.kind, prop: ProjectModel.id, isList: true };
  const [data, loaded] = useK8sWatchResource<K8sResourceKind[]>(projectResource);
  useFormikValidationFix(values);
  if (!values.type) {
    return null;
  }
  let EventSource: React.ReactElement;
  switch (values.type) {
    case EventSources.CronJobSource:
      EventSource = <CronJobSection />;
      break;
    case EventSources.SinkBinding:
      EventSource = <SinkBindingSection />;
      break;
    case EventSources.ApiServerSource:
      EventSource = <ApiServerSection />;
      break;
    case EventSources.KafkaSource:
      EventSource = <KafkaSourceSection />;
      break;
    case EventSources.ContainerSource:
      EventSource = <ContainerSourceSection />;
      break;
    case EventSources.PingSource:
      EventSource = <PingSourceSection />;
      break;
    default:
      EventSource = <YAMLEditorSection />;
  }
  return (
    <>
      {EventSource}
      {isKnownEventSource(values.type) && (
        <>
          <SinkSection namespace={namespace} />
          <AppSection
            project={values.project}
            noProjectsAvailable={loaded && _.isEmpty(data)}
            extraMargin
          />
        </>
      )}
    </>
  );
};

export default EventSourceSection;
