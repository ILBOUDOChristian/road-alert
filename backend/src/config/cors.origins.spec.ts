import { isAllowedOrigin } from './cors.origins';

describe('isAllowedOrigin', () => {
  const allowList = 'http://localhost:*';

  it('allows requests with no Origin (mobile / curl)', () => {
    expect(isAllowedOrigin(undefined, allowList)).toBe(true);
  });

  it('allows any localhost port (Flutter web)', () => {
    expect(isAllowedOrigin('http://localhost:54321', allowList)).toBe(true);
  });

  it('rejects unknown origins', () => {
    expect(isAllowedOrigin('http://evil.example', allowList)).toBe(false);
  });
});
