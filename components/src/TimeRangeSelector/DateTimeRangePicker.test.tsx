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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AbsoluteTimeRange } from '@perses-dev/spec';
import { AbsoluteTimeFormProps, DateTimeRangePicker } from './DateTimeRangePicker';

type ExpectedType = {
  start_time_input: string;
  end_time_input: string;
};

type MockDataType = Omit<AbsoluteTimeFormProps, 'onChange'> & {
  title: string;
  expected: ExpectedType;
};

describe('DateTimeRangePicker', () => {
  const spy = jest.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions');
  const INITIAL_TIME_RANGE: AbsoluteTimeRange = {
    start: new Date('2026-03-09T10:00:00+01:00'),
    end: new Date('2026-03-09T11:00:00+01:00'),
  };

  const onCancel = jest.fn();
  const MOCK_DATA_COLLECTIONS: MockDataType[] = [
    {
      title: 'should consider local time zone',
      timeZone: 'local',
      initialTimeRange: INITIAL_TIME_RANGE,
      onCancel,
      expected: {
        start_time_input: '2026-03-09 10:00:00',
        end_time_input: '2026-03-09 11:00:00',
      },
    },
    {
      title: 'should consider local time zone',
      timeZone: 'browser',
      initialTimeRange: INITIAL_TIME_RANGE,
      onCancel,

      expected: {
        start_time_input: '2026-03-09 10:00:00',
        end_time_input: '2026-03-09 11:00:00',
      },
    },
    {
      title: 'should consider london GMT+0 time zone',
      timeZone: 'Europe/London',
      initialTimeRange: INITIAL_TIME_RANGE,
      onCancel,

      expected: {
        start_time_input: '2026-03-09 09:00:00',
        end_time_input: '2026-03-09 10:00:00',
      },
    },
  ];

  MOCK_DATA_COLLECTIONS.forEach((mock) => {
    const { title, initialTimeRange, onCancel, timeZone, expected } = mock;

    spy.mockReturnValue({
      timeZone: 'Europe/Berlin',
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
    });

    test(title, () => {
      render(
        <DateTimeRangePicker
          timeZone={timeZone}
          onChange={jest.fn()}
          onCancel={onCancel}
          initialTimeRange={initialTimeRange}
        />
      );

      Object.keys(expected).forEach((k) => {
        const element = screen.getByTestId(k);
        expect(element).toBeInTheDocument();
        const text = within(element).getByDisplayValue(expected[k as keyof ExpectedType]);
        expect(text).toBeInTheDocument();
      });
    });

    test('onChange should receive the local time regardless of the timezone', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onChange = jest.fn<[AbsoluteTimeRange], any[]>();
      render(
        <DateTimeRangePicker
          timeZone={timeZone}
          onChange={onChange}
          onCancel={onCancel}
          initialTimeRange={initialTimeRange}
        />
      );
      const applyButton = screen.getByRole('button', { name: /apply/i });
      expect(applyButton).toBeInTheDocument();
      userEvent.click(applyButton);
      expect(onChange).toHaveBeenLastCalledWith({
        start: new Date(INITIAL_TIME_RANGE.start),
        end: new Date(INITIAL_TIME_RANGE.end),
      });
    });
  });
});
