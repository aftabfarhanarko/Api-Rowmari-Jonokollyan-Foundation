import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

/**
 * Enterprise pipe that automatically strips leading and trailing whitespace
 * from all string fields in incoming request payloads.
 */
@Injectable()
export class TrimStringsPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value && typeof value === 'object' && metadata.type === 'body') {
      return this.trimObject(value);
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  }

  private trimObject(obj: Record<string, any>): Record<string, any> {
    if (!obj || typeof obj !== 'object') return obj;
    const trimmed: Record<string, any> = Array.isArray(obj) ? [] : {};
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string') {
        trimmed[key] = val.trim();
      } else if (val && typeof val === 'object') {
        trimmed[key] = this.trimObject(val);
      } else {
        trimmed[key] = val;
      }
    }
    return trimmed;
  }
}
