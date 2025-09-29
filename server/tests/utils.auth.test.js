const { validatePasswordStrength } = require('../utils/auth');

describe('validatePasswordStrength (development)', () => {
  const originalEnv = process.env.NODE_ENV;
  beforeAll(() => {
    process.env.NODE_ENV = 'development';
  });
  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('accepts 6+ chars in non-production without extra constraints', () => {
    const weakButLongEnough = 'aaaaaa';
    const result = validatePasswordStrength(weakButLongEnough);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects too short passwords', () => {
    const tooShort = 'abc';
    const result = validatePasswordStrength(tooShort);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/at least 6 characters/);
  });
});

describe('validatePasswordStrength (production)', () => {
  const originalEnv = process.env.NODE_ENV;
  beforeAll(() => {
    process.env.NODE_ENV = 'production';
  });
  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('requires upper, lower and number in production', () => {
    // Missing number
    let result = validatePasswordStrength('AbcdefgH');
    expect(result.isValid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/number/);

    // Missing uppercase
    result = validatePasswordStrength('abcdefg1');
    expect(result.isValid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/uppercase/);

    // Missing lowercase
    result = validatePasswordStrength('ABCDEFG1');
    expect(result.isValid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/lowercase/);

    // Meets all
    result = validatePasswordStrength('Abcdef1');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
