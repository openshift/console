import * as React from 'react';
import { Base64 } from 'js-base64';
import { saveAs } from 'file-saver';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';

import { CopyToClipboard } from './utils/copy-to-clipboard';
import { EmptyBox, SectionHeading } from '../utils';
import { useTranslation } from 'react-i18next';

export const MaskedData: React.FC<{}> = () => (
  <>
    <span className="sr-only">Value hidden</span>
    <span aria-hidden="true">&bull;&bull;&bull;&bull;&bull;</span>
  </>
);

const downloadBinary = (key, value) => {
  const rawBinary = window.atob(value);
  const rawBinaryLength = rawBinary.length;
  const array = new Uint8Array(new ArrayBuffer(rawBinaryLength));
  for (let i = 0; i < rawBinaryLength; i++) {
    array[i] = rawBinary.charCodeAt(i);
  }
  const blob = new Blob([array], { type: 'data:application/octet-stream;' });
  saveAs(blob, key);
};

export const ConfigMapBinaryData: React.FC<DownloadValueProps> = ({ data }) => {
  const dl = [];
  Object.keys(data || {})
    .sort()
    .forEach(k => {
      const value = data[k];
      dl.push(<dt key={`${k}-k`}>{k}</dt>);
      dl.push(
        <dd key={`${k}-v`}>
          <Button className="pf-m-link--align-left" type="button" onClick={() => downloadBinary(k, value)} variant="link">
            Save File
          </Button>
        </dd>,
      );
    });
  return dl.length ? <dl>{dl}</dl> : <EmptyBox label="Binary Data" />;
};
ConfigMapBinaryData.displayName = 'ConfigMapBinaryData';

export const ConfigMapData: React.FC<ConfigMapDataProps> = ({ data, label }) => {
  const dl = [];
  Object.keys(data || {})
    .sort()
    .forEach(k => {
      const value = data[k];
      dl.push(<dt key={`${k}-k`}>{k}</dt>);
      dl.push(
        <dd key={`${k}-v`}>
          <CopyToClipboard value={value} />
        </dd>,
      );
    });
  return dl.length ? <dl>{dl}</dl> : <EmptyBox label={label} />;
};
ConfigMapData.displayName = 'ConfigMapData';

export const SecretValue: React.FC<SecretValueProps> = ({ isTable, value, reveal, encoded = true }) => {
  if (!value) {
    return <span className="text-muted">No value</span>;
  }

  const decodedValue = encoded ? Base64.decode(value) : value;
  // const decodedValue = value;
  const visibleValue = reveal ? decodedValue : <MaskedData />;
  return <CopyToClipboard value={decodedValue} visibleValue={visibleValue} isTable={isTable} />;
};
SecretValue.displayName = 'SecretValue';

export const SecretData: React.FC<SecretDataProps> = ({ data, title, isTable }) => {
  const [reveal, setReveal] = React.useState(false);
  const { t } = useTranslation();

  const dl = [];
  Object.keys(data || {})
    .sort()
    .forEach(k => {
      dl.push(<dt key={`${k}-k`}>{`Root ${k.toUpperCase()}`}</dt>);
      dl.push(<dd key={`${k}-v`}>{k === 'id' ? <SecretValue encoded={false} value={data[k]} reveal={true} isTable={isTable} /> : <SecretValue value={data[k]} reveal={reveal} isTable={isTable} />}</dd>);
    });

  return (
    <>
      <SectionHeading text={title}>
        {dl.length ? (
          <Button type="button" onClick={() => setReveal(!reveal)} variant="link" className="pf-m-link--align-right">
            {reveal ? (
              <>
                <EyeSlashIcon className="co-icon-space-r" />
                {`${t('COMMON:MSG_DETAILS_TABSIGNERKEY_3')}`}
              </>
            ) : (
              <>
                <EyeIcon className="co-icon-space-r" />
                {`${t('COMMON:MSG_DETAILS_TABSIGNERKEY_2')}`}
              </>
            )}
          </Button>
        ) : null}
      </SectionHeading>
      {dl.length ? <dl className="secret-data">{dl}</dl> : <EmptyBox label="Data" />}
    </>
  );
};
SecretData.displayName = 'SecretData';

type KeyValueData = {
  [key: string]: string;
};

type ConfigMapDataProps = {
  data: KeyValueData;
  label: string;
};

type DownloadValueProps = {
  data: KeyValueData;
};

type SecretValueProps = {
  value: string;
  encoded?: boolean;
  reveal: boolean;
  isTable?: boolean;
};

type SecretDataProps = {
  data: KeyValueData;
  title?: string;
  isTable?: boolean;
};
