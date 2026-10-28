// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { isSafeUrl, sanitizeUrl } from './url';

describe('isSafeUrl', () => {
  it.each([
    'https://perses.dev',
    'http://localhost:3000/projects/perses/dashboards/demo?var-job=node',
    'HTTPS://PERSES.DEV',
    '//perses.dev/docs',
    '/projects/perses/dashboards/demo',
    'projects/perses',
    './explore?data=%24var',
    '../dashboards',
    '?var-job=node',
    '#panel-1',
    '',
    'mailto:perses@example.com',
    'tel:+33100000000',
    'sms:+33100000000',
    'slack://channel?team=T123&id=C123',
    'msteams:/l/channel/123',
    'vscode://file/home/perses/main.go',
    'vscode-insiders://file/home/perses/main.go',
    'zoommtg://zoom.us/join?confno=123',
  ])('accepts %j', (url) => {
    expect(isSafeUrl(url)).toBe(true);
  });

  it.each([
    'javascript:alert(document.domain)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    '\u0000javascript:alert(1)',
    '\u001fjavascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'java\rscript:alert(1)',
    'javascript\t:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'blob:https://perses.dev/uuid',
    'ftp://perses.dev',
    'ssh://perses.dev',
    'http://[invalid',
  ])('rejects %j', (url) => {
    expect(isSafeUrl(url)).toBe(false);
  });
});

describe('sanitizeUrl', () => {
  it('returns the URL untouched when it is safe', () => {
    expect(sanitizeUrl('/explore?data=%24var')).toBe('/explore?data=%24var');
  });

  it('returns undefined when the URL is unsafe', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined();
  });

  it('returns undefined when there is no URL', () => {
    expect(sanitizeUrl(undefined)).toBeUndefined();
  });
});
