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

export const DEFAULT_ANNOTATION_COLOR = '#FF6B6B';

export const formatDate = (
  timeMs: number,
  format: (date: Date, format: string) => string
): { date: string; time: string } => {
  // Disallows NaN, Infinity, and -Infinity
  if (!Number.isFinite(timeMs)) {
    return { date: 'N/A', time: 'N/A' };
  }

  const d = new Date(timeMs);
  return {
    date: format(d, 'MMM dd, yyyy'),
    time: format(d, 'HH:mm:ss'),
  };
};
