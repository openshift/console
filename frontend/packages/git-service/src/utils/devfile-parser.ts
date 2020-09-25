import { CommandEntry, parse } from 'docker-file-parser';

export class DevfileParser {
  devfileContent: string;


  parsedCommands: CommandEntry[];

  constructor(devfileContent: string) {
    this.devfileContent = devfileContent;
    // this.parsedCommands = this.parse();
  }

  parse(): CommandEntry[] {
    return parse(this.devfileContent);
  }

    getDevfileVersion(devfileContent: string): string {
        this.devfileContent = devfileContent;
        let version = this.devfileContent.split("\n",1)[0].split(" ")[1];
        return version;
    }
}


