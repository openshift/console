import type { FC } from 'react';
import { Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { DASH } from '@console/dynamic-plugin-sdk/src/app/constants';
import { humanizeDecimalBytes } from '@console/internal/components/utils/units';
import type { NodeKind } from '@console/internal/module/k8s';
import { useDeepCompareMemoize } from '@console/shared/src/hooks/useDeepCompareMemoize';
import { useWatchBareMetalHost } from '../../utils/NodeBareMetalUtils';

type LocalDisksProps = {
  node: NodeKind;
};

export type BareMetalHostDisk = {
  hctl?: string;
  model: string;
  name: string;
  rotational: boolean;
  serialNumber?: string;
  sizeBytes?: number;
  vendor?: string;
};

type LocalDiskRowProps = {
  obj: BareMetalHostDisk;
};

const LocalDiskRow: FC<LocalDiskRowProps> = ({ obj }) => {
  const { t } = useTranslation();
  const { string: size } =
    obj.sizeBytes !== undefined ? humanizeDecimalBytes(obj.sizeBytes) : { string: DASH };

  return (
    <tr className="pf-v6-c-table__tr">
      <td className="pf-v6-c-table__td">{obj.name}</td>
      <td className="pf-v6-c-table__td">{size}</td>
      <td className="pf-v6-c-table__td">
        {obj.rotational ? t('console-app~Rotational') : t('console-app~SSD')}
      </td>
      <td className="pf-v6-c-table__td">{obj.model}</td>
      <td className="pf-v6-c-table__td">{obj.serialNumber ?? DASH}</td>
      <td className="pf-v6-c-table__td">{obj.vendor ?? DASH}</td>
      <td className="pf-v6-c-table__td">{obj.hctl ?? DASH}</td>
    </tr>
  );
};

const LocalDisks: FC<LocalDisksProps> = ({ node }) => {
  const { t } = useTranslation();
  const [bareMetalHost, bareMetalHostLoaded, bareMetalHostLoadError] = useWatchBareMetalHost(node);

  const disks = useDeepCompareMemoize(
    bareMetalHostLoaded && !bareMetalHostLoadError && bareMetalHost
      ? bareMetalHost.status?.hardware?.storage ?? []
      : [],
  );

  return (
    <>
      <Title headingLevel="h3" className="co-section-heading">
        <span>{t('console-app~Local disks')}</span>
      </Title>
      {!bareMetalHostLoaded ? (
        <div className="loading-skeleton--table pf-v6-u-w-100" />
      ) : bareMetalHostLoadError ? (
        t('console-app~Unable to load local disks')
      ) : (
        <div className="co-table-container">
          <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
            <thead className="pf-v6-c-table__thead">
              <tr className="pf-v6-c-table__tr">
                <th className="pf-v6-c-table__th">{t('console-app~Name')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Size')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Type')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Model')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Serial number')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Vendor')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~HCTL')}</th>
              </tr>
            </thead>
            <tbody className="pf-v6-c-table__tbody">
              {disks.length === 0 ? (
                <tr className="pf-v6-c-table__tr">
                  <td className="pf-v6-c-table__td" colSpan={7}>
                    {t('console-app~No local disks found')}
                  </td>
                </tr>
              ) : (
                disks.map((disk) => <LocalDiskRow key={disk.name} obj={disk} />)
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default LocalDisks;
