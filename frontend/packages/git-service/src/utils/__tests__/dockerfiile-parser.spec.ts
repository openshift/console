import { DockerFileParser } from '../dockerfile-parser';

describe('Dockerfile parsing tests', () => {
  it('Should parse dockerfile properly', () => {
    const contents = 'FROM ubuntu:latest\n ADD . /root\n RUN echo done\n EXPOSE 8080';
    const parser = new DockerFileParser(contents);
    const cmds = parser.parse();
    expect(cmds.length).toBeGreaterThan(0);
  });

  it('Should return container port', () => {
    const contents = 'FROM ubuntu:latest\n ADD . /root\n RUN echo done\n EXPOSE 8080';
    const parser = new DockerFileParser(contents);
    const no = parser.getContainerPort();
    expect(no).toEqual(8080);
  });
});
