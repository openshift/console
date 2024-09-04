import { CommandEntry, parse } from 'docker-file-parser';

export class DockerFileParser {
  content: string;

  parsedCommands: CommandEntry[];

  constructor(content: string) {
    this.content = content;
    this.parsedCommands = this.parse();
  }

  parse(): CommandEntry[] {
    let parsedContent: CommandEntry[] = [];
    try {
      parsedContent = parse(this.content);
    } catch {} // eslint-disable-line no-empty
    return parsedContent;
  }

  getContainerPort(): number {
    const cmd = this.parsedCommands.filter((c: CommandEntry) => c.name === 'EXPOSE');
    if (cmd.length > 0) {
      const exposeCommand = cmd[0];
      if ((exposeCommand.args.length as number) > 0) return Number(exposeCommand.args[0]);
    }
    return null;
  }
}
