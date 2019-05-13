/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { Base64 } from 'js-base64';

import { CopyToClipboard, EmptyBox, SectionHeading } from './utils';

export const MaskedData: React.FC<{}> = () => <React.Fragment>
  <span className="sr-only">Value hidden</span>
  <span aria-hidden="true">&bull;&bull;&bull;&bull;&bull;</span>
</React.Fragment>;

export const ConfigMapData: React.FC<ConfigMapDataProps> = ({data}) => {
  const dl = [];
  Object.keys(data || {}).sort().forEach(k => {
    const value = data[k];
    dl.push(<dt key={`${k}-k`}>{k}</dt>);
    dl.push(<dd key={`${k}-v`}><CopyToClipboard value={value} /></dd>);
  });
  return dl.length ? <dl>{dl}</dl> : <EmptyBox label="Data" />;
};
ConfigMapData.displayName = 'ConfigMapData';

const SecretValue: React.FC<SecretValueProps> = ({value, reveal}) => {
  if (!value) {
    return <span className="text-muted">No value</span>;
  }

  const decodedValue = Base64.decode(value);
  const visibleValue = reveal ? decodedValue : <MaskedData />;
  return <CopyToClipboard value={decodedValue} visibleValue={visibleValue} />;
};
SecretValue.displayName = 'SecretValue';

export const SecretData: React.FC<SecretDataProps> = ({data}) => {
  const [reveal, setReveal] = React.useState(false);

  const dl = [];
  Object.keys(data || {}).sort().forEach(k => {
    dl.push(<dt key={`${k}-k`}>{k}</dt>);
    dl.push(<dd key={`${k}-v`}><SecretValue value={data[k]} reveal={reveal} /></dd>);
  });

  return (
    <React.Fragment>
      <SectionHeading text="Data">
        {dl.length
          ? <button className="btn btn-link" type="button" onClick={() => setReveal(!reveal)}>
            {reveal
              ? <React.Fragment><i className="fa fa-eye-slash" aria-hidden="true" /> Hide Values</React.Fragment>
              : <React.Fragment><i className="fa fa-eye" aria-hidden="true" /> Reveal Values</React.Fragment>}
          </button>
          : null}
      </SectionHeading>
      {dl.length ? <dl className="secret-data">{dl}</dl> : <EmptyBox label="Data" />}
    </React.Fragment>
  );
};
SecretData.displayName = 'SecretData';

type KeyValueData = {
  [key: string]: string;
};

type ConfigMapDataProps = {
  data: KeyValueData;
};

type SecretValueProps = {
  value: string;
  reveal: boolean;
};

type SecretDataProps = {
  data: KeyValueData;
};
