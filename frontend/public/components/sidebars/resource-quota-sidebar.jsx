import * as _ from 'lodash-es';
import * as React from 'react';

import { ResourceQuotaModel } from '../../models';
import { referenceForModel } from '../../module/k8s';
import { SampleYaml } from './resource-sidebar';

const samples = [
  {
    header: 'Set compute resource quota',
    details: 'Limit the total amount of memory and CPU that can be used in a namespace.',
    templateName: 'rq-compute',
    kind: referenceForModel(ResourceQuotaModel),
  },
  {
    header: 'Set maximum count for any resource',
    details: 'Restrict maximum count of each resource so users cannot create more than the allotted amount.',
    templateName: 'rq-counts',
    kind: referenceForModel(ResourceQuotaModel),
  },
  {
    header: 'Specify resource quotas for a given storage class',
    details: 'Limit the size and number of persistent volume claims that can be created with a storage class.',
    templateName: 'rq-storageclass',
    kind: referenceForModel(ResourceQuotaModel),
  },
];

export const ResourceQuotaSidebar = ({loadSampleYaml, downloadSampleYaml}) => <ol className="co-resource-sidebar-list">
  {_.map(samples, (sample) => <SampleYaml
    key={sample.templateName}
    sample={sample}
    loadSampleYaml={loadSampleYaml}
    downloadSampleYaml={downloadSampleYaml} />)}
</ol>;
