import type { FC } from 'react';
import { useState, useEffect } from 'react';
import {
  Alert,
  AboutModal as PfAboutModal,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom-v5-compat';
import { Trans, useTranslation } from 'react-i18next';
import { useClusterVersion } from '@console/shared/src/hooks/version';
import { BlueArrowCircleUpIcon } from '@console/shared/src/components/status/icons';
import { useCanClusterUpgrade } from '@console/shared/src/hooks/useCanClusterUpgrade';
import { usePluginInfo } from '@console/plugin-sdk/src/api/usePluginInfo';
import { getBrandingDetails, MASTHEAD_TYPE, useCustomLogoURL } from './utils/branding';
import { ReleaseNotesLink } from './utils/release-notes-link';
import {
  ServiceLevel,
  useServiceLevelTitle,
  ServiceLevelText,
  ServiceLevelLoading,
} from './utils/service-level';
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

const DynamicPlugins: FC = () => {
  const { t } = useTranslation();
  const pluginInfoEntries = usePluginInfo();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadedPlugins = pluginInfoEntries.filter((plugin) => plugin.status === 'loaded');
    const sortedLoadedPlugins = loadedPlugins.sort((a, b) =>
      a.manifest.name.localeCompare(b.manifest.name),
    );

    setItems(
      sortedLoadedPlugins?.map((plugin) => {
        return (
          <Content
            component="li"
            key={`${plugin.manifest.name}-${plugin.manifest.version}`}
          >{`${plugin.manifest.name} (${plugin.manifest.version})`}</Content>
        );
      }),
    );
  }, [pluginInfoEntries]);

  return items.length > 0 ? (
    <Content component="ul" isPlainList>
      {items}
    </Content>
  ) : (
    <>{t('public~None')}</>
  );
};

const AboutModalItems: FC<AboutModalItemsProps> = ({ closeAboutModal }) => {
  const [kubernetesVersion, setKubernetesVersion] = useState('');
  const { t } = useTranslation();
  useEffect(() => {
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

export const AboutModal: FC<AboutModalProps> = (props) => {
  const { isOpen, closeAboutModal } = props;
  const { t } = useTranslation();
  const { productName } = getBrandingDetails();
  const { logoUrl: customLogoUrl } = useCustomLogoURL(MASTHEAD_TYPE);

  const customBranding = customLogoUrl || window.SERVER_FLAGS.customProductName;
  const openShiftBranding = window.SERVER_FLAGS.branding !== 'okd';
  return (
    <PfAboutModal
      isOpen={isOpen}
      onClose={closeAboutModal}
      productName={productName}
      brandImageSrc={customLogoUrl || (openShiftBranding && redHatFedoraImg)}
      brandImageAlt={(openShiftBranding || customLogoUrl) && productName}
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
