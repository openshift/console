import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as fuzzy from 'fuzzysearch';
import { PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  InputGroup,
  SelectOption,
  SelectVariant,
  Split,
  SplitItem,
  Stack,
  StackItem,
  TextInput,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { FLAGS, VirtualizedGrid } from '@console/shared';
import { StatusBox, ResourceName } from '@console/internal/components/utils';
import { useFlag } from '@console/shared/src/hooks/flag';
import { ProjectModel } from '@console/internal/models';

import {
  getTemplateName,
  getTemplateProvider,
  getTemplateProviderType,
  ProvidedType,
  templateProviders,
} from '../../../selectors/vm-template/basic';
import { getTemplateOSIcon, PinnedIcon } from '../../vm-templates/os-icons';
import { VMTemplateLabel } from '../../vm-templates/label';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { getTemplateSourceStatus } from '../../../statuses/template/template-source-status';
import { TemplateSource } from '../../vm-templates/vm-template-source';
import { getWorkloadProfile } from '../../../selectors/vm';
import {
  getTemplateFlavorDesc,
  getTemplateOperatingSystems,
  getTemplateSizeRequirement,
} from '../../../selectors/vm-template/advanced';
import { TemplateItem } from '../../../types/template';
import { isTemplateSourceError, TemplateSourceStatus } from '../../../statuses/template/types';
import { usePinnedTemplates } from '../../../hooks/use-pinned-templates';
import { BOOT_SOURCE_AVAILABLE, BOOT_SOURCE_REQUIRED } from '../../../constants';
import { FormPFSelect } from '../../form/form-pf-select';
import { VMTemplateSupport } from '../../vm-templates/vm-template';

import './select-template.scss';

type TemplateTileProps = {
  template: TemplateItem;
  sourceStatus: TemplateSourceStatus;
  selectTemplate: React.Dispatch<TemplateItem>;
  isSelected: boolean;
  isPinned: boolean;
};

const TemplateTile: React.FC<TemplateTileProps> = ({
  template: templateItem,
  sourceStatus,
  selectTemplate,
  isSelected,
  isPinned,
}) => {
  const { t } = useTranslation();
  const [template] = templateItem.variants;

  const osName = getTemplateOperatingSystems(templateItem.variants)?.[0]?.name;
  const workloadProfile = getWorkloadProfile(template) || t('kubevirt-plugin~Not available');
  const provider = getTemplateProvider(t, template, true);

  return (
    <CatalogTile
      featured={isSelected}
      className="kv-select-template__tile"
      icon={<img src={getTemplateOSIcon(template)} alt="" />}
      badges={[isPinned && <PinnedIcon />, <VMTemplateLabel template={template} />]}
      title={
        <Stack>
          <StackItem>
            <b>{getTemplateName(template)}</b>
          </StackItem>
          {provider && <StackItem className="text-secondary">{provider}</StackItem>}
        </Stack>
      }
      onClick={() => selectTemplate(templateItem)}
      footer={
        <TemplateSource loadError={false} loaded template={template} sourceStatus={sourceStatus} />
      }
    >
      <Stack>
        <StackItem>
          {t('kubevirt-plugin~Project: {{ namespace }}', {
            namespace: template.metadata.namespace,
          })}
        </StackItem>
        <StackItem>{t('kubevirt-plugin~Type: {{workloadProfile}}', { workloadProfile })}</StackItem>
        <StackItem>
          {t('kubevirt-plugin~Flavor: {{ flavor }}', {
            flavor: getTemplateFlavorDesc(template),
          })}
        </StackItem>
        <StackItem>
          {t('kubevirt-plugin~Storage: {{ storage }}', {
            storage: getTemplateSizeRequirement(template, sourceStatus),
          })}
        </StackItem>
        {osName && (
          <StackItem>
            {t('kubevirt-plugin~OS: {{ osName }}', {
              osName,
            })}
          </StackItem>
        )}
      </Stack>
    </CatalogTile>
  );
};

const renderTile = (props: TemplateTileProps & { key: string }) => <TemplateTile {...props} />;

type SelectTemplateProps = {
  selectTemplate: React.Dispatch<TemplateItem>;
  selectedTemplate: TemplateItem;
  pods: PodKind[];
  dataVolumes: V1alpha1DataVolume[];
  pvcs: PersistentVolumeClaimKind[];
  templates: TemplateItem[];
  namespace: string;
  namespaces: string[];
  setNamespace: React.Dispatch<string>;
  loaded: boolean;
  loadError: any;
  templatePreselectError: string;
};

export const SelectTemplate: React.FC<SelectTemplateProps> = ({
  selectTemplate,
  selectedTemplate,
  pods,
  dataVolumes,
  templates,
  pvcs,
  namespace,
  namespaces,
  setNamespace,
  loaded,
  loadError,
  templatePreselectError,
}) => {
  const { t } = useTranslation();
  const [isPinned] = usePinnedTemplates();
  const [filters, setFilters] = React.useState<{
    text: string;
    provider: ProvidedType[];
    bootSource: string[];
  }>({
    text: undefined,
    provider: undefined,
    bootSource: undefined,
  });

  const clearFilter = (type?: string | { key: string; name: string }, id?: string) => {
    if (!type && !id) {
      setFilters({
        text: undefined,
        provider: undefined,
        bootSource: undefined,
      });
    } else if (type && !id && typeof type !== 'string') {
      setFilters({
        ...filters,
        [type.key]: undefined,
      });
    } else if (typeof type === 'string' && id) {
      setFilters({
        ...filters,
        [type]: filters[type]?.filter((f) => f !== id),
      });
    }
  };

  const onSelect = (type, e, value) => {
    if (!filters[type]?.includes(value)) {
      setFilters({
        ...filters,
        [type]: filters[type] ? [...filters[type], value] : [value],
      });
    } else {
      setFilters({
        ...filters,
        [type]: filters[type]?.filter((f) => f !== value),
      });
    }
  };

  const items: TemplateTileProps[] = templates
    .map((template) => ({
      key: template.metadata.uid,
      template,
      selectTemplate,
      isSelected: template.metadata.uid === selectedTemplate?.metadata.uid,
      sourceStatus: getTemplateSourceStatus({
        pods,
        pvcs,
        dataVolumes,
        template: template.variants[0],
      }),
      isPinned: isPinned(template),
    }))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : +1;
      }
      return getTemplateName(a.template.variants[0]).localeCompare(
        getTemplateName(b.template.variants[0]),
        navigator.languages[0] || navigator.language,
        {
          numeric: true,
          ignorePunctuation: true,
        },
      );
    });

  const filteredItems = items.filter((item) => {
    // filter out user templates without source
    if (
      isTemplateSourceError(item.sourceStatus) ||
      (item.sourceStatus && !item.sourceStatus.isReady)
    ) {
      return false;
    }
    const textFilterLowerCase = filters.text?.toLowerCase();
    const operatingSystems = getTemplateOperatingSystems(item.template.variants);
    const textFilter = textFilterLowerCase
      ? fuzzy(textFilterLowerCase, getTemplateName(item.template.variants[0]).toLowerCase()) ||
        operatingSystems.some(
          (os) =>
            fuzzy(textFilterLowerCase, os.name.toLowerCase()) ||
            fuzzy(textFilterLowerCase, os.id.toLowerCase()),
        )
      : true;
    const providerFilter =
      filters.provider?.length > 0
        ? filters.provider.includes(getTemplateProviderType(item.template))
        : true;

    let bootSourceFilter = true;
    if (filters.bootSource?.length > 0) {
      if (!item.sourceStatus) {
        bootSourceFilter = filters.bootSource.includes(BOOT_SOURCE_REQUIRED);
      } else if (!isTemplateSourceError(item.sourceStatus)) {
        bootSourceFilter =
          filters.bootSource.includes(item.sourceStatus?.provider) && item.sourceStatus?.isReady;
      }
    }
    return textFilter && providerFilter && bootSourceFilter;
  });

  const canListNs = useFlag(FLAGS.CAN_LIST_NS);
  const allProjects = t('kubevirt-plugin~All projects');

  return (
    <Stack className="kv-select-template">
      <StackItem className="kv-select-template__title">
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h5" size="lg">
              {t('kubevirt-plugin~Select a template')}
            </Title>
          </StackItem>
          <StackItem>
            {t(
              'kubevirt-plugin~Only templates with valid boot source will be shown. The virtual machine can be customized from the review step.',
            )}
            <VMTemplateSupport />
          </StackItem>
          {templatePreselectError && (
            <StackItem>
              <Alert variant={AlertVariant.danger} isInline title={t(templatePreselectError)} />
            </StackItem>
          )}
          <StackItem>
            <Toolbar
              className="kv-select-template__toolbar"
              collapseListedFiltersBreakpoint="xl"
              clearAllFilters={clearFilter}
            >
              <ToolbarContent>
                <ToolbarGroup variant="filter-group">
                  <Split hasGutter>
                    <SplitItem>
                      <ToolbarItem>
                        <FormPFSelect
                          variant={SelectVariant.single}
                          aria-label={t('kubevirt-plugin~Project')}
                          onSelect={(e, val: string) =>
                            setNamespace(val === allProjects ? undefined : val)
                          }
                          selections={namespace}
                          className="kv-select-template__project"
                          closeOnSelect={false}
                        >
                          {(canListNs
                            ? [allProjects, ...namespaces.sort()]
                            : namespaces.sort()
                          ).map((ns) => (
                            <SelectOption key={ns} value={ns}>
                              <ResourceName kind={ProjectModel.kind} name={ns} />
                            </SelectOption>
                          ))}
                        </FormPFSelect>
                      </ToolbarItem>
                    </SplitItem>
                    <SplitItem>
                      <ToolbarFilter
                        chips={filters.provider}
                        deleteChip={clearFilter}
                        deleteChipGroup={clearFilter}
                        categoryName={{
                          key: 'provider',
                          name: t('kubevirt-plugin~Template provider'),
                        }}
                      >
                        <FormPFSelect
                          variant={SelectVariant.checkbox}
                          aria-label={t('kubevirt-plugin~Template provider')}
                          onSelect={(e, val) => onSelect('provider', e, val)}
                          selections={filters.provider}
                          placeholderText={
                            filters.provider?.length
                              ? t('kubevirt-plugin~Template provider')
                              : t('kubevirt-plugin~All template providers')
                          }
                          className="kv-select-template__filter"
                        >
                          {templateProviders(t).map((tp) => (
                            <SelectOption key={tp.id} value={tp.id}>
                              {tp.title}
                            </SelectOption>
                          ))}
                        </FormPFSelect>
                      </ToolbarFilter>
                    </SplitItem>
                    <SplitItem>
                      <ToolbarFilter
                        chips={filters.bootSource}
                        deleteChip={clearFilter}
                        deleteChipGroup={clearFilter}
                        categoryName={{ key: 'bootSource', name: t('kubevirt-plugin~Boot source') }}
                      >
                        <FormPFSelect
                          variant={SelectVariant.checkbox}
                          aria-label={t('kubevirt-plugin~Boot source')}
                          onSelect={(e, val) => onSelect('bootSource', e, val)}
                          selections={filters.bootSource}
                          placeholderText={
                            filters.bootSource?.length
                              ? t('kubevirt-plugin~Boot source')
                              : t('kubevirt-plugin~All boot sources')
                          }
                          className="kv-select-template__filter"
                        >
                          <SelectOption value={BOOT_SOURCE_AVAILABLE} />
                          <SelectOption value={BOOT_SOURCE_REQUIRED} />
                        </FormPFSelect>
                      </ToolbarFilter>
                    </SplitItem>
                  </Split>
                </ToolbarGroup>
                <ToolbarItem>
                  <InputGroup>
                    <TextInput
                      name="textFilter"
                      id="textFilter"
                      type="search"
                      aria-label="text filter"
                      onChange={(text) => setFilters({ ...filters, text })}
                      value={filters.text}
                      placeholder={t('kubevirt-plugin~Search by name, OS ...')}
                    />
                    <Button
                      variant={ButtonVariant.control}
                      aria-label={t('kubevirt-plugin~Search')}
                    >
                      <SearchIcon />
                    </Button>
                  </InputGroup>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
          </StackItem>
        </Stack>
      </StackItem>
      <StackItem isFilled>
        <StatusBox
          data={templates}
          loaded={loaded}
          loadError={loadError}
          label={t('kubevirt-plugin~Resources')}
        >
          <VirtualizedGrid
            items={filteredItems}
            renderCell={renderTile}
            cellWidth={300}
            celldefaultHeight={340}
          />
        </StatusBox>
      </StackItem>
    </Stack>
  );
};
