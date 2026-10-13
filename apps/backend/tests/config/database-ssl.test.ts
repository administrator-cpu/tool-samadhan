import { describe, it, expect } from 'vitest';

describe('PostgreSQL SSL Configuration Logic', () => {
  const resolveSslConfig = (envPostgresSsl: string | undefined, nodeEnv: string | undefined) => {
    const isSsl = envPostgresSsl !== undefined && envPostgresSsl !== ''
      ? envPostgresSsl.toLowerCase() === 'true' || envPostgresSsl === '1'
      : (nodeEnv || 'production') === 'development';

    return isSsl ? { rejectUnauthorized: false } : false;
  };

  it('enables SSL with rejectUnauthorized: false when POSTGRES_SSL is "true"', () => {
    expect(resolveSslConfig('true', 'production')).toEqual({ rejectUnauthorized: false });
    expect(resolveSslConfig('1', 'production')).toEqual({ rejectUnauthorized: false });
  });

  it('disables SSL (false) when POSTGRES_SSL is "false"', () => {
    expect(resolveSslConfig('false', 'development')).toBe(false);
    expect(resolveSslConfig('0', 'development')).toBe(false);
  });

  it('defaults to SSL enabled in development when POSTGRES_SSL is unset (for Aiven cloud DB)', () => {
    expect(resolveSslConfig(undefined, 'development')).toEqual({ rejectUnauthorized: false });
  });

  it('defaults to SSL disabled in production when POSTGRES_SSL is unset (for same-server DB)', () => {
    expect(resolveSslConfig(undefined, 'production')).toBe(false);
  });
});
