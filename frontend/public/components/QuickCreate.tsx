import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Tooltip,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils/namespace';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import type { FC, Ref } from 'react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FLAGS } from '@console/shared/src/constants';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src';
import { useNavigate } from 'react-router-dom-v5-compat';

type QuickCreateProps = {
  namespace?: string;
};

const getImportFromGitURL = (namespace: string) =>
  namespace === ALL_NAMESPACES_KEY ? '/import/ns/default' : `/import/ns/${namespace}`;
const getContainerImageURL = (namespace: string) =>
  namespace === ALL_NAMESPACES_KEY ? '/deploy-image/ns/default' : `/deploy-image/ns/${namespace}`;

const useCanCreateResource = () => {
  const canCreateBuildConfig = useAccessReview({
    group: 'build.openshift.io',
    resource: 'buildconfigs',
    verb: 'create',
  });
  const canCreateImageStream = useAccessReview({
    group: 'image.openshift.io',
    resource: 'imagestreams',
    verb: 'create',
  });
  const canCreateDeploymentConfig = useAccessReview({
    group: 'apps.openshift.io',
    resource: 'deploymentconfigs',
    verb: 'create',
  });
  const canCreateImageStreamImport = useAccessReview({
    group: 'image.openshift.io',
    resource: 'imagestreamimports',
    verb: 'create',
  });
  const canCreateSecret = useAccessReview({ group: '', resource: 'secrets', verb: 'create' });
  const canCreateRoute = useAccessReview({
    group: 'route.openshift.io',
    resource: 'routes',
    verb: 'create',
  });
  const canCreateService = useAccessReview({ group: '', resource: 'services', verb: 'create' });

  return (
    canCreateBuildConfig &&
    canCreateImageStream &&
    canCreateDeploymentConfig &&
    canCreateImageStreamImport &&
    canCreateSecret &&
    canCreateRoute &&
    canCreateService
  );
};

const QuickCreate: FC<QuickCreateProps> = ({ namespace }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fireTelemetryEvent = useTelemetry();
  const opeshiftStartGuideEnable = useFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE);

  const canCreate = useCanCreateResource();
  const [isOpen, setIsOpen] = useState(false);
  const importYAMLURL = formatNamespacedRouteForResource('import', namespace);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };
  return !opeshiftStartGuideEnable ? (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(open: boolean) => setIsOpen(open)}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <Tooltip content={t('public~Quick create')} position="bottom">
          <MenuToggle
            ref={toggleRef}
            aria-label={t('public~Quick create')}
            variant="plain"
            onClick={onToggleClick}
            isExpanded={isOpen}
            data-test="quick-create-dropdown"
            data-tour-id="tour-quick-create-button"
            data-quickstart-id="qs-masthead-import"
            icon={<PlusCircleIcon alt="" />}
          />
        </Tooltip>
      )}
      popperProps={{
        position: 'center',
      }}
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DropdownItem
          value={0}
          key="Import YAML"
          to={importYAMLURL}
          onClick={(ev: any) => {
            ev.preventDefault();
            fireTelemetryEvent('quick-create-import-yaml');
            navigate(importYAMLURL);
          }}
          tooltipProps={{
            content: t('public~Create resources from their YAML or JSON definitions'),
            position: 'left',
          }}
          data-test="qc-import-yaml"
        >
          {t('public~Import YAML')}
        </DropdownItem>
        {canCreate && (
          <>
            <DropdownItem
              value={1}
              key="Import from Git"
              to={getImportFromGitURL(namespace)}
              onClick={(ev: any) => {
                ev.preventDefault();
                fireTelemetryEvent('quick-create-import-from-git');
                navigate(getImportFromGitURL(namespace));
              }}
              tooltipProps={{
                content: t('public~Import code from your Git repository to be built and deployed'),
                position: 'left',
              }}
              data-test="qc-import-from-git"
            >
              {t('public~Import from Git')}
            </DropdownItem>
            <DropdownItem
              value={2}
              key="Container images"
              to={getContainerImageURL(namespace)}
              onClick={(ev: any) => {
                ev.preventDefault();
                fireTelemetryEvent('quick-create-container-images');
                navigate(getContainerImageURL(namespace));
              }}
              tooltipProps={{
                content: t(
                  'public~Deploy an existing Image from an Image registry or Image stream tag',
                ),
                position: 'left',
              }}
              data-test="qc-container-images"
            >
              {t('public~Container images')}
            </DropdownItem>
          </>
        )}
      </DropdownList>
    </Dropdown>
  ) : null;
};

export default QuickCreate;

export const QuickCreateImportFromGit = ({ namespace, className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const opeshiftStartGuideEnable = useFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE);

  const canCreate = useCanCreateResource();
  const handleClick = useCallback(() => {
    navigate(getImportFromGitURL(namespace));
  }, [navigate, namespace]);

  return (
    canCreate &&
    !opeshiftStartGuideEnable && (
      <button type="button" onClick={handleClick} className={className}>
        {t('public~Import from Git')}
      </button>
    )
  );
};

export const QuickCreateContainerImages = ({ namespace, className }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const opeshiftStartGuideEnable = useFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE);

  const canCreate = useCanCreateResource();
  const handleClick = useCallback(() => {
    navigate(getContainerImageURL(namespace));
  }, [navigate, namespace]);

  return (
    canCreate &&
    !opeshiftStartGuideEnable && (
      <button type="button" onClick={handleClick} className={className}>
        {t('public~Container images')}
      </button>
    )
  );
};
