import { CommandEntry, parse } from 'docker-file-parser';

export class DockerFileParser {
  content: string;

  parsedCommands: CommandEntry[];

  constructor(content: string) {
    this.content = content;
    this.parsedCommands = this.parse();
  }

  parse(): CommandEntry[] {
    return parse(this.content);
  }

  getContainerPort(): number {
    const cmd = this.parsedCommands.filter((c: CommandEntry) => c.name === 'EXPOSE');
    if (cmd.length > 0) {
      const exposeCommand = cmd[0];
      if (exposeCommand.args.length > 0) return Number(exposeCommand.args[0]);
    }
    return null;
  }
}
