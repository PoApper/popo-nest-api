import { Logger } from '@nestjs/common';

type LogFieldValue = string | number | boolean | null | undefined;
type LogFields = Record<string, LogFieldValue>;

export class AuthLogger {
  private readonly logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  log(event: string, fields: LogFields): void {
    this.logger.log(this.format(event, fields));
  }

  warn(event: string, fields: LogFields): void {
    this.logger.warn(this.format(event, fields));
  }

  error(event: string, fields: LogFields, stack?: string): void {
    this.logger.error(this.format(event, fields), stack);
  }

  private format(event: string, fields: LogFields): string {
    const lines = [`[${event}]`];
    for (const [key, value] of Object.entries(fields)) {
      lines.push(`- ${key}: ${this.sanitize(value)}`);
    }
    return lines.join('\n');
  }

  private sanitize(value: LogFieldValue): string {
    if (value == null) return '(없음)';
    const str = String(value);
    return str.replace(/[\r\n]/g, '');
  }
}
