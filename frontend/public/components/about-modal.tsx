import * as React from 'react';
import {
  Alert,
  AboutModal as PfAboutModal,
  TextContent,
  TextList,
  TextListItem,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useClusterVersion, BlueArrowCircleUpIcon, useCanClusterUpgrade } from '@console/shared';
import { isLoadedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { useDynamicPluginInfo } from '@console/plugin-sdk/src/api/useDynamicPluginInfo';
import { getBrandingDetails } from './masthead';
import {
  ReleaseNotesLink,
  ServiceLevel,
  useServiceLevelTitle,
  ServiceLevelText,
  ServiceLevelLoading,
} from './utils';
import { k8sVersion } from '../module/status';
import {
  getClusterID,
  getCurrentVersion,
  getK8sGitVersion,
  getOpenShiftVersion,
  hasAvailableUpdates,
} from '../module/k8s/cluster-settings';

const DynamicPlugins: React.FC = () => {
  const { t } = useTranslation();
  const [pluginInfoEntries] = useDynamicPluginInfo();
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    const loadedPlugins = pluginInfoEntries.filter(isLoadedDynamicPluginInfo);
    const sortedLoadedPlugins = loadedPlugins.sort((a, b) =>
      a.metadata.name.localeCompare(b.metadata.name),
    );

    setItems(
      sortedLoadedPlugins?.map((plugin) => {
        return (
          <TextListItem
            key={plugin.pluginID}
          >{`${plugin.metadata.name} (${plugin.metadata.version})`}</TextListItem>
        );
      }),
    );
  }, [pluginInfoEntries]);

  return items.length > 0 ? (
    <TextList className="co-text-list-plain">{items}</TextList>
  ) : (
    t('public~None')
  );
};

const AboutModalItems: React.FC<AboutModalItemsProps> = ({ closeAboutModal }) => {
  const [kubernetesVersion, setKubernetesVersion] = React.useState('');
  const { t } = useTranslation();
  React.useEffect(() => {
    k8sVersion()
      .then((response) => setKubernetesVersion(getK8sGitVersion(response) || '-'))
      .catch(() => setKubernetesVersion(t('public~unknown')));
  }, [t]);
  const clusterVersion = useClusterVersion();
  const canUpgrade = useCanClusterUpgrade();
  const serviceLevelTitle = useServiceLevelTitle();

  const clusterID = getClusterID(clusterVersion);
  const channel: string = clusterVersion?.spec?.channel;
  const openshiftVersion = getOpenShiftVersion(clusterVersion);

  return (
    <>
      {canUpgrade && hasAvailableUpdates(clusterVersion) && (
        <Alert
          className="co-alert co-about-modal__alert"
          title={
            <Trans t={t} ns="public">
              Cluster update available.{' '}
              <Link to="/settings/cluster?showVersions" onClick={closeAboutModal}>
                Update cluster
              </Link>
            </Trans>
          }
          customIcon={<BlueArrowCircleUpIcon />}
        />
      )}
      <TextContent>
        <TextList component="dl">
          {openshiftVersion && (
            <>
              <TextListItem component="dt">{t('public~OpenShift version')}</TextListItem>
              <TextListItem component="dd">
                <div className="co-select-to-copy">{openshiftVersion}</div>
                <ReleaseNotesLink version={getCurrentVersion(clusterVersion)} />
              </TextListItem>
            </>
          )}
          <TextListItem component="dt">{t('public~Kubernetes version')}</TextListItem>
          <TextListItem component="dd" className="co-select-to-copy">
            {kubernetesVersion}
          </TextListItem>
          {channel && (
            <>
              <TextListItem component="dt">{t('public~Channel')}</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy">
                {channel}
              </TextListItem>
            </>
          )}
          {clusterID && (
            <>
              <TextListItem component="dt">{t('public~Cluster ID')}</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy">
                {clusterID}
              </TextListItem>
            </>
          )}
          <TextListItem component="dt">{t('public~API server')}</TextListItem>
          <TextListItem component="dd" className="co-select-to-copy">
            {window.SERVER_FLAGS.kubeAPIServerURL}
          </TextListItem>

          <ServiceLevel
            clusterID={clusterID}
            loading={
              <>
                <TextListItem component="dt">{serviceLevelTitle}</TextListItem>
                <TextListItem component="dd">
                  <ServiceLevelLoading />
                </TextListItem>
              </>
            }
          >
            <>
              <TextListItem component="dt">{serviceLevelTitle}</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy">
                <ServiceLevelText inline clusterID={clusterID} />
              </TextListItem>
            </>
          </ServiceLevel>

          <TextListItem component="dt">{t('public~Dynamic plugins')}</TextListItem>
          <TextListItem component="dd">
            <DynamicPlugins />
          </TextListItem>
        </TextList>
      </TextContent>
    </>
  );
};
AboutModalItems.displayName = 'AboutModalItems';

export const AboutModal: React.FC<AboutModalProps> = (props) => {
  const { isOpen, closeAboutModal } = props;
  const { t } = useTranslation();
  const details = getBrandingDetails();
  const customBranding = window.SERVER_FLAGS.customLogoURL || window.SERVER_FLAGS.customProductName;
  return (
    <PfAboutModal
      isOpen={isOpen}
      onClose={closeAboutModal}
      productName=""
      brandImageSrc={details.logoImg}
      brandImageAlt={details.productName}
      noAboutModalBoxContentContainer={true}
    >
      {!customBranding && (
        <p>
          {t(
            "public~OpenShift is Red Hat's container application platform that allows developers to quickly develop, host, and scale applications in a cloud environment.",
          )}
        </p>
      )}
      <AboutModalItems {...(props as any)} />
    </PfAboutModal>
  );
};
AboutModal.displayName = 'AboutModal';

type AboutModalItemsProps = {
  closeAboutModal: () => void;
};

type AboutModalProps = {
  isOpen: boolean;
  closeAboutModal: () => void;
};
