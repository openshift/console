import { Terminal, ITerminalAddon } from 'xterm';
import './xterm-addon-fullscreen.scss';

export class XtermAddonFullscreen implements ITerminalAddon {
  private terminal: Terminal | undefined;

  public activate(terminal: Terminal): void {
    this.terminal = terminal;
  }

  public dispose(): void {
    if (this.terminal?.element.classList.contains('fullscreen')) {
      this.terminal?.element.classList.remove('fullscreen');
    }
  }

  public toggleFullScreen(fullscreen?: boolean): void {
    let fn: string;

    if (typeof fullscreen === 'undefined') {
      fn = this.terminal?.element.classList.contains('fullscreen') ? 'remove' : 'add';
    } else if (!fullscreen) {
      fn = 'remove';
    } else {
      fn = 'add';
    }

    this.terminal?.element.classList[fn]('fullscreen');
  }
}
