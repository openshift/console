import * as React from 'react';
import { Helmet } from 'react-helmet';
import { PageBody } from '@console/shared';
import StreamsInstanceFilter from './StreamsInstanceFilter';
import StreamsInstanceTable from './StreamsInstanceTable';
import { PageHeading } from '@console/internal/components/utils';

const StreamsInstancePage = () => {
  return (
    <>
      <Helmet>
        <title>Select Bindable OpenShift Streams for Apache Kafka</title>
      </Helmet>
      <PageHeading
        className="rhoas__page-heading"
        title="Select Bindable OpenShift Streams for Apache Kafka"
      >
        <p>Select all of the OpenShift Streams instances youd like to connect to.</p>
      </PageHeading>
      <PageBody>
        <StreamsInstanceFilter />
        <StreamsInstanceTable />
      </PageBody>
    </>
  );
};

export default StreamsInstancePage;
