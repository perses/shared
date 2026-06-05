// LOGZ.IO ADDITION:: General numeric text field that preserves partial input [APPZ-1996]
//
// A controlled numeric input that keeps the user's RAW typed string as the
// editing source of truth, instead of re-deriving the displayed text from a
// parsed number on every render. That re-derivation is what makes the common
// `value={n}` + `onChange={Number(e.target.value)}` pattern clobber valid
// in-progress strings — ".0", "0.", ".05", a lone "-", an emptied field — by
// snapping the box back to String(Number(x)) mid-typing (and, for fields that
// blank on 0, erasing the value entirely).
//
// The parsed number is lifted via `onChange` (or `undefined` when empty); the
// parent's normalized value only overwrites the local draft when it changes
// from OUTSIDE (programmatic reset, list re-sort, account switch) — never as an
// echo of the user's own keystrokes. Optional clamping / empty-fallback are
// applied on blur, mirroring the SeriesLimitField "buffer then commit" pattern.

import { ReactElement, useRef, useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

// Strings accepted WHILE typing. The decimal form permits not-yet-valid
// intermediates ("", "-", ".", "0.", ".0", "1e", "1e-") so the user can build
// any number left-to-right; the integer form permits only an optional sign and
// digits. Anything else (letters, a second dot) is rejected at the keystroke.
const DECIMAL_DRAFT = /^[-+]?(\d*\.?\d*)([eE][-+]?\d*)?$/;
const INTEGER_DRAFT = /^[-+]?\d*$/;

const toDraft = (value: number | undefined): string =>
  value === undefined || Number.isNaN(value) ? '' : String(value);

// Parse a draft to a committable number. Empty and not-yet-complete strings
// ("." , "-", "1e") return `undefined`, so partial input is never force-parsed.
const toNumber = (draft: string): number | undefined => {
  if (draft.trim() === '') return undefined;
  const parsed = Number(draft);

  return Number.isNaN(parsed) ? undefined : parsed;
};

export interface INumberInputProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'type' | 'inputMode'> {
  /** Canonical model value. `undefined` renders an empty field. */
  value: number | undefined;
  /** Receives the parsed number, or `undefined` when the field is empty. */
  onChange: (value: number | undefined) => void;
  /** Clamp the committed value to `>= min` on blur. */
  min?: number;
  /** Clamp the committed value to `<= max` on blur. */
  max?: number;
  /**
   * Value committed on blur when the field is left empty (e.g. a default of 1).
   * Also lets an empty field stay visually empty while focused even when the
   * parent coerces the empty state back to this number.
   */
  emptyValue?: number;
  /** Restrict input to whole numbers (no decimal point or exponent). */
  integer?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  emptyValue,
  integer = false,
  onBlur,
  ...textFieldProps
}: INumberInputProps): ReactElement {
  const [draft, setDraft] = useState<string>(() => toDraft(value));
  const lastValueRef = useRef<number | undefined>(value);

  // True when the current draft already represents `value` — i.e. `value` is an
  // echo of what we just typed, so the draft (possibly a partial like ".0") must
  // be kept. An empty draft is treated as representing `emptyValue` too.
  const draftRepresents = (next: number | undefined): boolean =>
    next === toNumber(draft) || (draft === '' && next === emptyValue);

  // Adjust the draft when `value` changes from OUTSIDE during render (the
  // officially-supported "store info from previous render" pattern). Echoes of
  // the user's own typing are filtered out by `draftRepresents`, so partial
  // strings are never clobbered.
  if (value !== lastValueRef.current) {
    lastValueRef.current = value;
    if (!draftRepresents(value)) {
      setDraft(toDraft(value));
    }
  }

  const allowed = integer ? INTEGER_DRAFT : DECIMAL_DRAFT;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const raw = event.target.value;
    if (!allowed.test(raw)) return;

    setDraft(raw);

    // An emptied field commits `undefined`; a complete number commits its value.
    // A non-empty partial ("." , "-", "1e") is only buffered — committing it
    // (as `undefined`) would let a number-only parent coerce it back and clobber
    // the keystroke, so we leave the parent value untouched until it completes.
    if (raw === '') {
      if (value !== undefined) {
        lastValueRef.current = undefined;
        onChange(undefined);
      }

      return;
    }

    const parsed = toNumber(raw);
    if (parsed !== undefined && parsed !== value) {
      lastValueRef.current = parsed;
      onChange(parsed);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    let committed = toNumber(draft);
    if (committed === undefined) {
      committed = emptyValue;
    } else {
      if (integer) committed = Math.trunc(committed);
      if (min !== undefined) committed = Math.max(min, committed);
      if (max !== undefined) committed = Math.min(max, committed);
    }

    const nextDraft = toDraft(committed);
    if (nextDraft !== draft) setDraft(nextDraft);
    if (committed !== value) {
      lastValueRef.current = committed;
      onChange(committed);
    }

    onBlur?.(event);
  };

  return (
    <TextField
      {...textFieldProps}
      type="text"
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      // `inputMode` must live on the underlying <input>, not the TextField root, to surface the
      // numeric mobile keyboard. A consumer-provided inputProps.inputMode still wins.
      inputProps={{ inputMode: integer ? 'numeric' : 'decimal', ...textFieldProps.inputProps }}
    />
  );
}
