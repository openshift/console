export interface DevfileSample {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  tags: string[];
  projectType: string;
  language: string;
  git: {
    remotes: {
      [remote: string]: string;
    };
  };
}
