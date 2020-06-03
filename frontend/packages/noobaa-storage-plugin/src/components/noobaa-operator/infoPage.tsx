import * as React from 'react';
import { Link } from 'react-router-dom';
import { Title } from '@patternfly/react-core';
import { ExternalLink, LabelList } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { PrometheusEndpoint } from '@console/internal/components/graphs/helpers';
import { NooBaaSystemModel } from '../../models';
import './infoPage.scss';
import { getMetric } from '../../utils';

const FAQ_TEXT_1 = 'How can I access the object service?';
const FAQ_LINK_1 =
  'https://access.redhat.com/documentation/en-us/red_hat_openshift_container_storage/4.2/html-single/managing_openshift_container_storage/index#accessing-the-multi-cloud-object-gateway-with-your-applications_rhocs';
const FAQ_TEXT_2 = 'How can I provide the object service to a developer?';
const FAQ_LINK_2 =
  'https://access.redhat.com/documentation/en-us/red_hat_openshift_container_storage/4.2/html-single/managing_openshift_container_storage/index#adding-storage-resources-for-hybrid-or-multi-cloud';
const FAQ_TEXT_3 = 'How can I provide the object service to DevOps?';
const FAQ_LINK_3 =
  'https://access.redhat.com/documentation/en-us/red_hat_openshift_container_storage/4.2/html-single/managing_openshift_container_storage/index#creating-an-object-bucket-claim-using-the-command-line-interface_rhocs';
const FAQ_TEXT_4 = 'How can I mirror data for hybrid and multi-cloud buckets?';
const FAQ_LINK_4 =
  'https://access.redhat.com/documentation/en-us/red_hat_openshift_container_storage/4.2/html-single/managing_openshift_container_storage/index#mirroring-data-for-hybrid-and-multi-cloud-buckets';

const getVersion = (obj: K8sResourceKind): string => {
  const { image } = obj.spec;
  const version = image.split(':')[1];
  return version;
};

const NOOBAA_DASHBOARD_LINK_QUERY = 'NooBaa_system_links';

const InfoPage: React.FC<InfoPageProps> = ({ obj }) => {
  const [response] = usePrometheusPoll({
    query: NOOBAA_DASHBOARD_LINK_QUERY,
    endpoint: PrometheusEndpoint.QUERY,
  });

  const systemLink = getMetric(response, 'dashboard');
  const analyticsLink = `${systemLink}/analytics`;
  const bucketsLink = `${systemLink}/buckets`;

  return (
    <div className="nb-data-section">
      <div className="nb-data-section__left">
        <dl>
          <dt>Name</dt>
          <dd>{obj.metadata.name}</dd>
          <dt>Labels</dt>
          <dd>
            <LabelList kind={NooBaaSystemModel.kind} labels={obj.metadata.labels} />
          </dd>
          <dt>Version</dt>
          <dd>{getVersion(obj)}</dd>
          <dt>Links</dt>
          <dd>
            <Link className="nb-data-section__left--block" to="/dashboards/object-service">
              Service Status
            </Link>
            <ExternalLink
              additionalClassName="nb-data-section__left--block"
              href={bucketsLink}
              text="Buckets List"
            />
            <ExternalLink
              additionalClassName="nb-data-section__left--block"
              href={analyticsLink}
              text="Analytics"
            />
          </dd>
          <dt>Maintainers</dt>
          <dd>Red Hat. Inc.</dd>
        </dl>
      </div>
      <div className="nb-data-section__right">
        <div className="nb-data-section__right-entry">
          <Title headingLevel="h2" size="xl">
            Description
          </Title>
          <p className="nb-data-section__right-entry--faded">
            Multi Cloud Gateway is a data platform for object data federation across private and
            public clouds.
          </p>
        </div>
        <div className="nb-data-section__right-entry">
          <Title headingLevel="h2" size="xl">
            FAQ
          </Title>
          <ul className="nb-data-section__right-faq">
            <li>
              <ExternalLink href={FAQ_LINK_1} text={FAQ_TEXT_1} />
            </li>
            <li>
              <ExternalLink href={FAQ_LINK_2} text={FAQ_TEXT_2} />
            </li>
            <li>
              <ExternalLink href={FAQ_LINK_3} text={FAQ_TEXT_3} />
            </li>
            <li>
              <ExternalLink href={FAQ_LINK_4} text={FAQ_TEXT_4} />
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

type InfoPageProps = {
  obj: K8sResourceKind;
};

export default InfoPage;
