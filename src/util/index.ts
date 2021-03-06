/**
 * Copyright (c) 2020 August
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Check if `data` is an object
 * @param data The data itself
 */
// eslint-disable-next-line
export const isObject = (data: unknown): data is object => typeof data === 'object' && !Array.isArray(data);

/**
 * Appends `'` if it's a string, an object (jsonb), or a Date
 * @param type The type to escape
 */
export const escape = (type: any) => {
  if (typeof type === 'string') return `'${type}'`;
  else if (isObject(type)) return `'${JSON.stringify(type)}'`;
  else if (type instanceof Date) return `'${type.toUTCString()}'`;
  else return type;
};

export interface SQLOptions {
  /** Is it nullable? */
  nullable?: boolean;

  /** Is it the primary key? */
  primary?: boolean;

  /** Is it an Array? */
  array?: boolean;

  /** Do we allocate a size for it? */
  size?: number;
}

/**
 * Converts a JavaScript type to SQL
 * @param name The name of the column
 * @param type The type to use
 * @param options Any additional options
 */
export function convertJSTypeToSql(
  name: string,
  type: 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function' | 'float' | 'array' | 'null' | 'class' | 'date', 
  options: SQLOptions
) {
  const isPrimary = options.hasOwnProperty('primary') && options.primary! ? ' PRIMARY KEY' : '';
  const isNullable = options.hasOwnProperty('nullable') && options.nullable! ? ' NULL' : '';
  const allocSize = options.hasOwnProperty('size') && options.size! > 1 ? options.size! : '';
  const isArray = options.hasOwnProperty('array') && options.array!;

  if (['function', 'class', 'symbol', 'undefined', 'null'].includes(type)) throw new Error(`Type "${type}" is not supported`);
  if (['boolean'].includes(type) && isArray) throw new TypeError('Array support for booleans will not be supported');
  if (isArray && (options.hasOwnProperty('primary') && options.primary!)) throw new Error('Primary key cannot be an Array');
  if (
    (options.hasOwnProperty('primary') && options.primary!) && 
    (options.hasOwnProperty('nullable') && options.nullable!)
  ) throw new Error('Primary key cannot be nullable');

  const size = allocSize > 1 ? `(${allocSize})` : '';
  const array = isArray ? `[${allocSize > 1 ? allocSize : ''}]` : '';
  switch (type) {
    case 'boolean': return `${name.toLowerCase()} BOOL${isNullable}${isPrimary}`;
    case 'date':
    case 'string': return `${name.toLowerCase()} VARCHAR${size}${array}${isNullable}${isPrimary}`;
    case 'object': return `${name.toLowerCase()} JSONB${size}${array}${isNullable}${isPrimary}`;
    case 'bigint': return `${name.toLowerCase()} BIGINT${array}${isNullable}${isPrimary}`;
    case 'number': return `${name.toLowerCase()} INTEGER${array}${isNullable}${isPrimary}`;
    case 'float': return `${name.toLowerCase()} DOUBLE${array}${isNullable}${isPrimary}`;

    default: throw new Error(`JavaScript type '${type}' is not a valid type`);
  }
}

/**
 * Converts an Array to SQL
 * @param values The values
 */
export const convertArrayToSql = (values: unknown[]) => `ARRAY[${values.length ? values.map(escape).join(', ') : ''}]`;

/**
 * Stringifies a JavaScript object
 * @param value The value to use
 */
export function getKindOf(value: unknown) {
  if (!['object', 'function', 'number'].includes(typeof value)) return typeof value;
  if (typeof value === 'number') return Number.isInteger(value) ? 'number' : 'float';
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'function') {
    const type = value.toString();

    if (type.startsWith('function')) return 'function';
    if (type.startsWith('class')) return 'class';
  }

  return 'object';
}