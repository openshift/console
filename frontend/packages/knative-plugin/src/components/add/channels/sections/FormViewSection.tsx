import * as React from 'react';
import { EVENTING_KAFKA_CHANNEL_KIND } from '../../../../const';
import DefaultChannelSection from './DefaultChannelSection';
import KafkaChannelSection from './KafkaChannelSection';

type FormViewSectionProps = {
  namespace: string;
  kind: string;
};

const getChannelSection = (kind: string): React.ReactElement | null => {
  if (kind === EVENTING_KAFKA_CHANNEL_KIND) {
    return <KafkaChannelSection />;
  }
  return null;
};

const FormViewSection: React.FC<FormViewSectionProps> = ({ namespace, kind }) => (
  <>
    {getChannelSection(kind)}
    <DefaultChannelSection namespace={namespace} />
  </>
);

export default FormViewSection;
