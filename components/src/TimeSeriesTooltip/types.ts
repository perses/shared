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

export interface NearbySeriesInfo {
  seriesIdx: number | null;
  datumIdx: number | null;
  seriesName: string;
  date: number;
  markerColor: string;
  x: number;
  y: number;
  formattedY: string;
  isClosestToCursor: boolean;
}

export type NearbySeriesArray = NearbySeriesInfo[];

export type Candidate = Omit<NearbySeriesInfo, 'isClosestToCursor' | 'seriesIdx' | 'datumIdx' | 'formattedY'> & {
  seriesIdx: number;
  datumIdx: number;
  seriesId: string;
  visualY: number;
  distance: number;
};

export type IsWithinPercentageRangeParams = {
  valueToCheck: number;
  baseValue: number;
  percentage: number;
};

export type GetYBufferParams = {
  yInterval: number;
  totalSeries: number;
  showAllSeries?: boolean;
};
