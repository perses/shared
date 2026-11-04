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

import { useTheme } from '@mui/material';
import type { Extension, ReactCodeMirrorProps } from '@uiw/react-codemirror';
import CodeMirror from '@uiw/react-codemirror';
import type { ReactElement } from 'react';
import { useState } from 'react';

export type CodeEditorProps<T> = Omit<
  ReactCodeMirrorProps,
  'onBlur' | 'theme' | 'extensions' | 'onChange' | 'value'
> & {
  value: T;
  placeholder?: string;
  onChange?: (next: string) => void;
};

type InternalCodeEditorProps<T> = CodeEditorProps<T> & {
  /** Language specific CodeMirror extensions. Must be stable across renders. */
  extensions: Extension[];
  /** Convert the initial value into the text displayed by the editor. */
  serialize: (value: T) => string;
};

/**
 * Internal base for the language specific editors (JSONEditor, YAMLEditor). Not exported from the package.
 */
export function CodeEditor<T>(props: InternalCodeEditorProps<T>): ReactElement {
  const { value: initialValue, serialize, extensions, onChange, ...rest } = props;
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [value, setValue] = useState(() => serialize(initialValue));
  const [lastProcessedValue, setLastProcessedValue] = useState<string>(value);

  return (
    <CodeMirror
      {...rest}
      style={{ border: `1px solid ${theme.palette.divider}` }}
      theme={isDarkMode ? 'dark' : 'light'}
      extensions={extensions}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        // Trigger the provided onChange callback in real-time
        if (onChange) {
          onChange(newValue);
        }
      }}
      onBlur={() => {
        // Don't trigger the provided onChange if the last processed value is equal to the current value.
        // This prevents e.g CTRL+F to trigger value refresh downstream, which would cause the embedded
        // find & replace interface to close immediately.
        if (lastProcessedValue !== value && onChange !== undefined) {
          onChange(value);
          setLastProcessedValue(value);
        }
      }}
      placeholder={props.placeholder}
    />
  );
}
