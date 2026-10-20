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

export type HexColor = `#${string}`;

export interface PersesColor {
  50: HexColor;
  100: HexColor;
  150: HexColor;
  200: HexColor;
  300: HexColor;
  400: HexColor;
  500: HexColor;
  600: HexColor;
  700: HexColor;
  800: HexColor;
  850: HexColor;
  900: HexColor;
  950: HexColor;
}

export const blue: PersesColor = {
  50: '#e3f2fd',
  100: '#bbdefb',
  150: '#a5d4fa',
  200: '#90caf9',
  300: '#64b5f6',
  400: '#42a5f5',
  500: '#2196f3',
  600: '#1e88e5',
  700: '#1976d2',
  800: '#1565c0',
  850: '#1156b0',
  900: '#0d47a1',
  950: '#062350',
};

export const green: PersesColor = {
  50: '#e8f5e9',
  100: '#c8e6c9',
  150: '#b7deb8',
  200: '#a5d6a7',
  300: '#81c784',
  400: '#66bb6a',
  500: '#4caf50',
  600: '#43a047',
  700: '#388e3c',
  800: '#2e7d32',
  850: '#256e29',
  900: '#1b5e20',
  950: '#0e2f10',
};

export const gray: PersesColor = {
  50: '#fafafa',
  100: '#f5f5f5',
  150: '#f0f0f0',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  850: '#303030',
  900: '#212121',
  950: '#121212',
};

export const orange: PersesColor = {
  50: '#fff3e0',
  100: '#ffe0b2',
  150: '#ffd699',
  200: '#ffcc80',
  300: '#ffb74d',
  400: '#ffa726',
  500: '#ff9800',
  600: '#fb8c00',
  700: '#f57c00',
  800: '#ef6c00',
  850: '#ea5e00',
  900: '#e65100',
  950: '#732900',
};

export const purple: PersesColor = {
  50: '#efe9fd',
  100: '#e0d2fc',
  150: '#d0bcfa',
  200: '#c1a6f8',
  300: '#a179f5',
  400: '#824df1',
  500: '#6320ee',
  600: '#4f1abe',
  700: '#3b138f',
  800: '#280d5f',
  850: '#1e0a47',
  900: '#140630',
  950: '#0a0318',
};

export const red: PersesColor = {
  50: '#ffebee',
  100: '#ffcdd2',
  150: '#f7b3b6',
  200: '#ef9a9a',
  300: '#e57373',
  400: '#ef5350',
  500: '#f44336',
  600: '#e53935',
  700: '#d32f2f',
  800: '#c62828',
  850: '#be2222',
  900: '#b71c1c',
  950: '#5c0e0e',
};

export const white = '#FFFFFF' as HexColor;
export const black = '#000000' as HexColor;
