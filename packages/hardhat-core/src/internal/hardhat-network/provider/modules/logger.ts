import util from "util";

export class ModulesLogger {
  private _logs: Array<string | [string, string]> = [];
  private _titleLength = 0;
  private _indentEnabled = false;
  private readonly _indent = 4;

  constructor(private _enabled: boolean) {}

  public isEnabled() {
    return this._enabled;
  }

  public setEnabled(enabled: boolean) {
    this._enabled = enabled;
  }

  public setIndentEnabled(flag: boolean) {
    this._indentEnabled = flag;
  }

  public log(message: string) {
    if (!this.isEnabled()) {
      return;
    }

    if (this._indentEnabled) {
      message = this._indentAllLines(message);
    }

    this._logs.push(message);
  }

  public logWithTitle(title: string, message: string) {
    if (!this.isEnabled()) {
      return;
    }

    if (this._indentEnabled) {
      title = this._indentSingleLine(title);
    }

    // We always use the max title length we've seen. Otherwise the value move
    // a lot with each tx/call.
    if (title.length > this._titleLength) {
      this._titleLength = title.length;
    }

    this._logs.push([title, message]);
  }

  public debug(...args: any[]) {
    this.log(util.format(args[0], ...args.splice(1)));
  }

  public clearLogs() {
    this._logs = [];
  }

  public hasLogs(): boolean {
    return this._logs.length > 0;
  }

  public getLogs(): string[] {
    return this._logs.map((l) => {
      if (typeof l === "string") {
        return l;
      }

      const title = `${l[0]}:`;

      return `${title.padEnd(this._titleLength + 1)} ${l[1]}`;
    });
  }

  private _indentSingleLine(message: string): string {
    return " ".repeat(this._indent) + message;
  }

  private _indentAllLines(message: string): string {
    return message
      .split("\n")
      .map((line) => this._indentSingleLine(line))
      .join("\n");
  }
}
