import * as React from 'react';
import {
  Alert,
  AboutModal as PfAboutModal,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom-v5-compat';
import { Trans, useTranslation } from 'react-i18next';
import { useClusterVersion, BlueArrowCircleUpIcon, useCanClusterUpgrade } from '@console/shared';
import { isLoadedDynamicPluginInfo } from '@console/plugin-sdk/src';
import { useDynamicPluginInfo } from '@console/plugin-sdk/src/api/useDynamicPluginInfo';
import { getBrandingDetails } from './utils/branding';
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
import redHatFedoraImg from '../imgs/red-hat-fedora.svg';
import redHatFedoraWatermarkImg from '../imgs/red-hat-fedora-watermark.svg';

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
          <Content
            component="li"
            key={plugin.pluginID}
          >{`${plugin.metadata.name} (${plugin.metadata.version})`}</Content>
        );
      }),
    );
  }, [pluginInfoEntries]);

  return items.length > 0 ? (
    <Content component="ul" className="co-text-list-plain">
      {items}
    </Content>
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
      <Content>
        <Content component="dl">
          {openshiftVersion && (
            <>
              <Content component="dt">{t('public~OpenShift version')}</Content>
              <Content component="dd">
                <div className="co-select-to-copy">{openshiftVersion}</div>
                <ReleaseNotesLink version={getCurrentVersion(clusterVersion)} />
              </Content>
            </>
          )}
          <Content component="dt">{t('public~Kubernetes version')}</Content>
          <Content component="dd" className="co-select-to-copy">
            {kubernetesVersion}
          </Content>
          {channel && (
            <>
              <Content component="dt">{t('public~Channel')}</Content>
              <Content component="dd" className="co-select-to-copy">
                {channel}
              </Content>
            </>
          )}
          {clusterID && (
            <>
              <Content component="dt">{t('public~Cluster ID')}</Content>
              <Content component="dd" className="co-select-to-copy">
                {clusterID}
              </Content>
            </>
          )}
          <Content component="dt">{t('public~API server')}</Content>
          <Content component="dd" className="co-select-to-copy">
            {window.SERVER_FLAGS.kubeAPIServerURL}
          </Content>

          <ServiceLevel
            clusterID={clusterID}
            loading={
              <>
                <Content component="dt">{serviceLevelTitle}</Content>
                <Content component="dd">
                  <ServiceLevelLoading />
                </Content>
              </>
            }
          >
            <>
              <Content component="dt">{serviceLevelTitle}</Content>
              <Content component="dd" className="co-select-to-copy">
                <ServiceLevelText inline clusterID={clusterID} />
              </Content>
            </>
          </ServiceLevel>

          <Content component="dt">{t('public~Dynamic plugins')}</Content>
          <Content component="dd">
            <DynamicPlugins />
          </Content>
        </Content>
      </Content>
    </>
  );
};
AboutModalItems.displayName = 'AboutModalItems';

export const AboutModal: React.FC<AboutModalProps> = (props) => {
  const { isOpen, closeAboutModal } = props;
  const { t } = useTranslation();
  const { productName } = getBrandingDetails();
  const customBranding = window.SERVER_FLAGS.customLogoURL || window.SERVER_FLAGS.customProductName;
  const openShiftBranding = window.SERVER_FLAGS.branding !== 'okd' && !customBranding;
  return (
    <PfAboutModal
      isOpen={isOpen}
      onClose={closeAboutModal}
      productName={productName}
      brandImageSrc={openShiftBranding && redHatFedoraImg}
      brandImageAlt={openShiftBranding && productName}
      backgroundImageSrc={openShiftBranding && `/${redHatFedoraWatermarkImg}`}
      hasNoContentContainer
      aria-label="About modal"
    >
      {!customBranding && (
        <Content component={ContentVariants.p}>
          {t(
            "public~OpenShift is Red Hat's container application platform that allows developers to quickly develop, host, and scale applications in a cloud environment.",
          )}
        </Content>
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
