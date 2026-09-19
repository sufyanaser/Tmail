import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tag = process.argv[2];
assert.ok(tag, 'A release tag is required.');

const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
assert.equal(tag, `v${manifest.version}`, `Tag ${tag} does not match package version ${manifest.version}.`);

console.log(`Release tag ${tag} matches package version ${manifest.version}.`);

