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

import { Stack } from '@mui/material';
import type { TimeZoneOption } from '@perses-dev/components';
import { TimeRangeControls } from '@perses-dev/plugin-system';
import type { ReactElement } from 'react';

export interface Props {
  isBiggerThanMd: boolean;
  timeZone: string;
  changeHandler: (tz: TimeZoneOption) => void;
}

export const StickyTimeRangeControls = (props: Props): ReactElement => {
  const { isBiggerThanMd, changeHandler, timeZone } = props;
  return (
    <Stack
      m={isBiggerThanMd ? 1.5 : 1}
      mt={isBiggerThanMd ? 1.5 : 0}
      ml={isBiggerThanMd ? 1.5 : 'auto'}
      direction="row"
      justifyContent="end"
    >
      <TimeRangeControls timeZone={timeZone} onTimeZoneChange={changeHandler} />
    </Stack>
  );
};
