export interface DevfileSample {
  name?: string;
  displayName: string;
  description?: string;
  icon?: string;
  iconClass?: string;
  tags: string[];
  projectType?: string;
  language?: string;
  git?: {
    remotes: {
      [remote: string]: string;
    };
  };
  provider?: string;
}

export interface DevfileComponent {
  name: string;
  kubernetes?: { uri?: string; inlined?: string; [key: string]: any };
  openshift?: { uri?: string; inlined?: string; [key: string]: any };
  [key: string]: any;
}

export interface Devfile {
  components?: DevfileComponent[];
  [key: string]: any;
}
