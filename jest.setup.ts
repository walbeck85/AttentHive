import '@testing-library/jest-dom';
import 'whatwg-fetch';

import { TextEncoder, TextDecoder } from 'util';

// Mock the Upstash modules globally to prevent ESM issues and avoid hitting Redis in tests
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    jest.fn().mockImplementation(() => ({
      limit: jest.fn().mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      }),
    })),
    {
      slidingWindow: jest.fn().mockReturnValue('sliding-window-config'),
    }
  ),
}));

// Next's server-side helpers (pulled in by app routes that import things like
// `next/cache`) expect Web-style TextEncoder/TextDecoder globals. Node's Jest
// environment does not always provide them, so I patch them here for tests.
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

// Polyfill Response.json static method for Next.js API route testing
// NextResponse.json() requires this static method which whatwg-fetch doesn't provide
if (typeof Response.json !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Response as any).json = function (data: unknown, init?: ResponseInit): Response {
    const body = JSON.stringify(data);
    const headers = new Headers(init?.headers);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return new Response(body, {
      ...init,
      headers,
    });
  };
}