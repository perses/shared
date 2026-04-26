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
  50: '#E7F1FC',
  100: '#D0E3FA',
  150: '#B8D5F7',
  200: '#A1C7F5',
  300: '#72ABF0',
  400: '#438FEB',
  500: '#1473E6',
  600: '#105CB8',
  700: '#0C458A',
  800: '#082E5C',
  850: '#062345',
  900: '#04172E',
  950: '#020C17',
};

export const green: PersesColor = {
  50: '#EAF9F1',
  100: '#D5F2E3',
  150: '#C1ECD4',
  200: '#ACE5C6',
  300: '#82D9AA',
  400: '#59CC8D',
  500: '#2FBF71',
  600: '#26995A',
  700: '#1C7344',
  800: '#134C2D',
  850: '#0E3922',
  900: '#092617',
  950: '#05130B',
};

export const gray: PersesColor = {
  50: '#F0F1F6',
  100: '#E1E3ED',
  150: '#D2D5E4',
  200: '#C3C7DB',
  300: '#A4ACC8',
  400: '#8690B6',
  500: '#717CA4',
  600: '#535D83',
  700: '#3E4662',
  800: '#2A2E42',
  850: '#1F2331',
  900: '#151721',
  950: '#0A0C10',
};

export const orange: PersesColor = {
  50: '#FFF5E8',
  100: '#FFECD2',
  150: '#FFE2BB',
  200: '#FFD9A4',
  300: '#FFC577',
  400: '#FFB249',
  500: '#FF9F1C',
  600: '#CC7F16',
  700: '#995F11',
  800: '#66400B',
  850: '#4D3008',
  900: '#332006',
  950: '#1A1003',
};

export const purple: PersesColor = {
  50: '#EFE9FD',
  100: '#E0D2FC',
  150: '#D0BCFA',
  200: '#C1A6F8',
  300: '#A179F5',
  400: '#824DF1',
  500: '#6320EE',
  600: '#4F1ABE',
  700: '#3B138F',
  800: '#280D5F',
  850: '#1E0A47',
  900: '#140630',
  950: '#0A0318',
};

export const red: PersesColor = {
  50: '#FDEDED',
  100: '#FBDADA',
  150: '#F9C8C8',
  200: '#F7B5B5',
  300: '#F29191',
  400: '#EE6C6C',
  500: '#EA4747',
  600: '#BD3939',
  700: '#902B2B',
  800: '#621D1D',
  850: '#4C1616',
  900: '#350F0F',
  950: '#1F0808',
};

export const white = '#FFFFFF' as HexColor;
export const black = '#000000' as HexColor;
