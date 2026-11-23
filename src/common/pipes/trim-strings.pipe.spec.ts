import { TrimStringsPipe } from './trim-strings.pipe';

describe('TrimStringsPipe', () => {
  let pipe: TrimStringsPipe;

  beforeEach(() => {
    pipe = new TrimStringsPipe();
  });

  it('should trim string values in a body object', () => {
    const input = {
      name: '  Anisur Rahman  ',
      email: '  test@example.com  ',
      nested: {
        address: '  Kurigram, Bangladesh  ',
      },
      count: 42,
    };

    const result = pipe.transform(input, { type: 'body' });
    expect(result.name).toBe('Anisur Rahman');
    expect(result.email).toBe('test@example.com');
    expect(result.nested.address).toBe('Kurigram, Bangladesh');
    expect(result.count).toBe(42);
  });

  it('should pass through non-body or non-object values unchanged', () => {
    expect(pipe.transform('  hello  ', { type: 'query' })).toBe('hello');
    expect(pipe.transform(123 as any, { type: 'query' })).toBe(123);
  });
});
