import '@testing-library/jest-dom';
import 'whatwg-fetch';

import { TextEncoder, TextDecoder } from 'util';

// Next's server-side helpers (pulled in by app routes that import things like
// `next/cache`) expect Web-style TextEncoder/TextDecoder globals. Node's Jest
// environment does not always provide them, so I patch them here for tests.
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}