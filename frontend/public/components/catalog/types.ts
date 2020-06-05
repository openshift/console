type Metadata = {
  uid?: string;
  name?: string;
  namespace?: string;
  creationTimestamp?: string;
};

export type Item = {
  obj?: {
    metadata?: Metadata;
    csv?: {
      kind?: string;
      spec: { displayName: string };
      metadata?: Metadata;
    };
  };
  createLabel: string;
  href: string;
  kind?: string;
  tileName?: string;
  tileImgUrl?: string;
  tileIconClass?: string;
  tileProvider?: string;
  tileDescription?: string;
  tags?: string[];
  longDescription?: string;
  documentationUrl?: string;
  supportUrl?: string;
  sampleRepo?: string;
  markdownDescription?: () => Promise<string>;
  customProperties?: React.ReactElement;
};

export type Plan = {
  metadata?: Metadata;
  spec?: {
    description?: string;
    externalName?: string;
  };
};
