import assert from 'node:assert/strict';
import test from 'node:test';
import { isSafeExternalUrl, isTrustedLarkHost, isTrustedLarkUrl } from '../dist/security.js';

test('accepts official Lark HTTPS hosts', () => {
  assert.equal(isTrustedLarkHost('larksuite.com'), true);
  assert.equal(isTrustedLarkHost('passport.larksuite.com'), true);
  assert.equal(isTrustedLarkUrl('https://cjp7nj6oqqn2.jp.larksuite.com/mail'), true);
});

test('rejects lookalike, insecure, and malformed Lark URLs', () => {
  assert.equal(isTrustedLarkHost('larksuite.com.evil.example'), false);
  assert.equal(isTrustedLarkHost('notlarksuite.com'), false);
  assert.equal(isTrustedLarkUrl('http://larksuite.com/mail'), false);
  assert.equal(isTrustedLarkUrl('not-a-url'), false);
});

test('allows only safe external protocols', () => {
  assert.equal(isSafeExternalUrl('https://example.org'), true);
  assert.equal(isSafeExternalUrl('mailto:hello@example.org'), true);
  assert.equal(isSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(isSafeExternalUrl('file:///C:/Windows/System32'), false);
});

