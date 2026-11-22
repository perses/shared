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

import { Field } from '@base-ui/react/field';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, forwardRef } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { ComponentsProvider, useComponents } from '../../contexts/ComponentsProvider';
import { Checkbox } from '../Checkbox';
import { defaultComponents, defaultIcons } from '../defaults';
import { Select, SelectItem } from '../Select';
import { Switch } from '../Switch';
import { TextField } from '../TextField';
import { FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel } from './index';
import type { FormControlLabelProps, FormControlProps } from './index';

const getRoot = (): HTMLElement => document.querySelector('.ps-FormControl') as HTMLElement;
const getLabel = (): HTMLLabelElement => document.querySelector('.ps-FormLabel') as HTMLLabelElement;
const getHelper = (): HTMLElement => document.querySelector('.ps-FormHelperText') as HTMLElement;

function renderField(props: Partial<FormControlProps> = {}, helper?: string): ReturnType<typeof render> {
  return render(
    <FormControl {...props}>
      <FormLabel>Name</FormLabel>
      <Field.Control />
      {helper && <FormHelperText>{helper}</FormHelperText>}
    </FormControl>,
  );
}

describe('FormControl + FormLabel + FormHelperText', () => {
  it('T1 links the label to the control through htmlFor and id', () => {
    renderField();
    const input = screen.getByLabelText('Name');
    expect(input.id).not.toBe('');
    expect(getLabel().htmlFor).toBe(input.id);
  });

  it('T2 keeps an explicit control id and still links the label', () => {
    render(
      <FormControl>
        <FormLabel>Name</FormLabel>
        <Field.Control id="name-input" />
      </FormControl>,
    );
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('id', 'name-input');
    expect(getLabel().htmlFor).toBe('name-input');
  });

  it('T2b accepts htmlFor for a control that is not registered with the field', () => {
    render(
      <FormControl>
        <FormLabel htmlFor="plain">Plain</FormLabel>
        <input id="plain" />
      </FormControl>,
    );
    expect(screen.getByLabelText('Plain')).toHaveAttribute('id', 'plain');
  });

  it('T3 describes the control with the helper text only when present', () => {
    const { unmount } = renderField({}, 'Must be unique');
    const input = screen.getByLabelText('Name');
    const helper = getHelper();
    expect(helper.id).not.toBe('');
    expect(input).toHaveAttribute('aria-describedby', helper.id);
    expect(input).toHaveAccessibleDescription('Must be unique');
    unmount();

    renderField();
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-describedby');
  });

  it('T4 marks error state on root, label, helper and control', () => {
    renderField({ status: 'error' }, 'Required');
    const input = screen.getByLabelText('Name');
    expect(getRoot()).toHaveAttribute('data-invalid');
    expect(getRoot()).toHaveAttribute('data-status', 'error');
    expect(getLabel()).toHaveAttribute('data-invalid');
    expect(getHelper()).toHaveAttribute('data-invalid');
    expect(getHelper()).toHaveAttribute('data-status', 'error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('T4b does not set aria-invalid for a warning status', () => {
    renderField({ status: 'warning' }, 'Careful');
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
    expect(getRoot()).toHaveAttribute('data-status', 'warning');
    expect(getRoot()).not.toHaveAttribute('data-invalid');
    expect(getHelper()).toHaveAttribute('data-status', 'warning');
  });

  it('T5 propagates disabled to root, label and control', () => {
    renderField({ disabled: true });
    expect(getRoot()).toHaveAttribute('data-disabled');
    expect(getLabel()).toHaveAttribute('data-disabled');
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });

  it('T6 flags required on the root without changing the accessible name', () => {
    renderField({ required: true });
    expect(getRoot()).toHaveAttribute('data-required');
    expect(screen.getByLabelText('Name')).toHaveAccessibleName('Name');
    expect(getLabel().textContent).toBe('Name');
  });

  it('T18 lets the FormControl own the label and helper of a nested TextField that opts in', () => {
    render(
      <FormControl>
        <FormLabel>Outer</FormLabel>
        <TextField labelledByFormControl />
        <FormHelperText>Outer help</FormHelperText>
      </FormControl>,
    );
    const input = screen.getByLabelText('Outer');
    expect(document.querySelectorAll('label')).toHaveLength(1);
    expect(input).toHaveAccessibleDescription('Outer help');
    expect(document.querySelector('.ps-TextField')).not.toHaveClass('ps-FormControl');
  });

  it.each([
    ['TextField', <TextField key="t" label="Inner" helperText="Inner help" />, 'textbox'],
    ['Select', <Select key="s" label="Inner" helperText="Inner help" />, 'combobox'],
  ])('T18b a nested %s without the opt-in keeps its own label and helper', (_name, control, role) => {
    render(
      <FormControl disabled>
        <FormLabel>Outer</FormLabel>
        {control}
        <FormHelperText>Outer help</FormHelperText>
      </FormControl>,
    );
    const element = screen.getByRole(role, { name: 'Inner' });
    expect(screen.getByText('Outer')).toBeInTheDocument();
    expect(element).toHaveAccessibleDescription('Outer help Inner help');
    expect(element.closest('.ps-TextField, .ps-Select')).toHaveAttribute('data-disabled');
  });

  it('T18c a TextField that opts in without a FormLabel has no accessible name', () => {
    render(
      <FormControl>
        <TextField labelledByFormControl />
      </FormControl>,
    );
    expect(screen.getByRole('textbox')).not.toHaveAccessibleName();
  });

  it('T19 exposes size through data-size and defaults to md', () => {
    const { unmount } = renderField();
    expect(getRoot()).toHaveAttribute('data-size', 'md');
    unmount();
    renderField({ size: 'sm' });
    expect(getRoot()).toHaveAttribute('data-size', 'sm');
  });

  it('names a Perses Checkbox placed inside a FormControl from the FormLabel', () => {
    render(
      <FormControl>
        <FormLabel>Enabled</FormLabel>
        <Checkbox aria-label="ignored by label" />
      </FormControl>,
    );
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Enabled');
  });
});

describe('controls nested in a FormControl', () => {
  it('links FormLabel and FormHelperText to a TextField with labelledByFormControl', () => {
    render(
      <FormControl status="error">
        <FormLabel>Name</FormLabel>
        <TextField labelledByFormControl placeholder="Type here" />
        <FormHelperText>Name is required</FormHelperText>
      </FormControl>,
    );
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveAccessibleDescription('Name is required');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.closest('.ps-TextField')).toHaveAttribute('data-status', 'error');
  });

  it('TextField inherits size, disabled and required from the FormControl unless set locally', () => {
    render(
      <FormControl size="sm" disabled required>
        <FormLabel>Name</FormLabel>
        <TextField labelledByFormControl />
      </FormControl>,
    );
    const input = screen.getByLabelText(/Name/);
    expect(input).toBeDisabled();
    expect(input).toBeRequired();
    expect(input.closest('.ps-TextField')).toHaveAttribute('data-size', 'sm');
    expect(input.closest('.ps-TextField')).toHaveAttribute('data-disabled');
  });

  it('local size and status win over inherited ones; a disabled FormControl always disables its control', () => {
    render(
      <FormControl size="sm" status="warning" disabled>
        <FormLabel>Name</FormLabel>
        <TextField labelledByFormControl size="lg" status="error" disabled={false} />
      </FormControl>,
    );
    const input = screen.getByLabelText('Name');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.closest('.ps-TextField')).toHaveAttribute('data-size', 'lg');
    expect(input.closest('.ps-TextField')).toHaveAttribute('data-status', 'error');
  });

  it.each([false, true])(
    'a local status="error" on a nested Select (searchable=%s) sets aria-invalid on the trigger',
    (searchable) => {
      render(
        <FormControl>
          <FormLabel>Unit</FormLabel>
          {searchable ? (
            <Select labelledByFormControl searchable status="error" defaultValue="bytes">
              <SelectItem value="bytes">Bytes</SelectItem>
            </Select>
          ) : (
            <Select labelledByFormControl status="error" defaultValue="bytes">
              <SelectItem value="bytes">Bytes</SelectItem>
            </Select>
          )}
        </FormControl>,
      );
      expect(screen.getByRole('combobox', { name: 'Unit' })).toHaveAttribute('aria-invalid', 'true');
    },
  );

  it.each([false, true])(
    'a local disabled on a nested TextField (multiline=%s) disables the input inside an enabled FormControl',
    (multiline) => {
      render(
        <FormControl>
          <FormLabel>Name</FormLabel>
          <TextField labelledByFormControl disabled multiline={multiline} />
        </FormControl>,
      );
      const input = screen.getByLabelText('Name');
      expect(input).toBeDisabled();
      expect(input.closest('.ps-TextField')).toHaveAttribute('data-disabled');
    },
  );

  it.each([false, true])(
    'names a Select (searchable=%s) with labelledByFormControl from the FormLabel',
    (searchable) => {
      render(
        <FormControl disabled>
          <FormLabel>Unit</FormLabel>
          {searchable ? (
            <Select labelledByFormControl searchable defaultValue="bytes" helperText="ignored">
              <SelectItem value="bytes">Bytes</SelectItem>
            </Select>
          ) : (
            <Select labelledByFormControl defaultValue="bytes" helperText="ignored">
              <SelectItem value="bytes">Bytes</SelectItem>
            </Select>
          )}
          <FormHelperText>Pick one</FormHelperText>
        </FormControl>,
      );
      const trigger = screen.getByRole('combobox', { name: 'Unit' });
      expect(trigger).toHaveAccessibleDescription('Pick one');
      expect(screen.queryByText('ignored')).toBeNull();
      expect(document.querySelector('.ps-Select')).toHaveAttribute('data-disabled');
    },
  );

  it('names a Checkbox with labelledByFormControl from FormControlLabel and inherits size', () => {
    render(
      <FormControlLabel label="Allow header sorting">
        <Checkbox labelledByFormControl size="lg" />
      </FormControlLabel>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Allow header sorting' });
    expect(checkbox).toHaveAttribute('data-size', 'lg');
  });

  it('Switch and Checkbox inherit disabled from FormControlLabel and FormControl', () => {
    render(
      <>
        <FormControlLabel label="Toggle" disabled>
          <Switch labelledByFormControl />
        </FormControlLabel>
        <FormControl size="sm" disabled>
          <FormLabel>Agree</FormLabel>
          <Checkbox labelledByFormControl />
        </FormControl>
      </>,
    );
    expect(screen.getByRole('switch', { name: 'Toggle' })).toHaveAttribute('aria-disabled', 'true');
    const checkbox = screen.getByRole('checkbox', { name: 'Agree' });
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    expect(checkbox).toHaveAttribute('data-size', 'sm');
  });

  it('FormControlLabel inside a FormControl keeps the outer disabled, required, size and status', () => {
    render(
      <FormControl disabled required size="sm" status="error">
        <FormControlLabel label="Agree">
          <Checkbox labelledByFormControl />
        </FormControlLabel>
        <FormHelperText>Required</FormHelperText>
      </FormControl>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Agree' });
    userEvent.click(screen.getByText('Agree'));
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    expect(checkbox).toHaveAttribute('aria-required', 'true');
    expect(checkbox).toHaveAttribute('data-size', 'sm');
    expect(checkbox).toHaveAccessibleDescription('Required');
  });

  it.each([
    ['TextField', <TextField key="t" labelledByFormControl disabled={false} />, 'textbox', '.ps-TextField'],
    ['Checkbox', <Checkbox key="c" labelledByFormControl disabled={false} />, 'checkbox', '.ps-Checkbox'],
    ['Switch', <Switch labelledByFormControl key="s" disabled={false} />, 'switch', '.ps-Switch'],
    [
      'Select',
      <Select key="l" labelledByFormControl disabled={false} defaultValue="a">
        <SelectItem value="a">A</SelectItem>
      </Select>,
      'combobox',
      '.ps-Select',
    ],
  ])('disabled={false} on a nested %s cannot re-enable a disabled FormControl', (_name, control, role, root) => {
    render(
      <FormControl disabled>
        <FormLabel>Name</FormLabel>
        {control}
      </FormControl>,
    );
    const element = screen.getByRole(role, { name: 'Name' });
    expect(element.closest(root)).toHaveAttribute('data-disabled');
    expect(element.matches(':disabled, [aria-disabled="true"]')).toBe(true);
  });

  it('FormControlLabel disabled wins over an enabled FormControl', () => {
    render(
      <FormControl>
        <FormControlLabel label="Agree" disabled>
          <Checkbox labelledByFormControl />
        </FormControlLabel>
      </FormControl>,
    );
    expect(screen.getByRole('checkbox', { name: 'Agree' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('labelledByFormControl is exclusive with label and aria-label at the type level', () => {
    render(
      <FormControl>
        <FormLabel>Name</FormLabel>
        {/* @ts-expect-error label and labelledByFormControl cannot be combined */}
        <TextField labelledByFormControl label="Dup" />
      </FormControl>,
    );
    expect(document.querySelectorAll('label')).toHaveLength(1);
  });
});

describe('FormGroup', () => {
  it('T7 renders a fieldset named by its legend', () => {
    render(
      <FormGroup legend="Template">
        <Checkbox label="A" />
      </FormGroup>,
    );
    const group = screen.getByRole('group', { name: 'Template' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group.querySelector('legend')).toHaveTextContent('Template');
    expect(group).toHaveClass('ps-FormGroup');
    expect(group.querySelector('legend')).toHaveClass('ps-FormGroup__legend');
  });

  it('T8 maps direction to the flex-direction style prop, including responsive values', () => {
    const { unmount } = render(<FormGroup direction="row">x</FormGroup>);
    let group = screen.getByRole('group');
    expect(group).toHaveClass('ps-flex-direction');
    expect(group).toHaveStyle({ '--ps-flex-direction': 'row' });
    unmount();

    render(<FormGroup direction={{ default: 'column', md: 'row' }}>x</FormGroup>);
    group = screen.getByRole('group');
    expect(group).toHaveStyle({
      '--ps-flex-direction': 'column',
      '--ps-flex-direction-md': 'row',
    });
  });

  it('T17 renders children in order and has no legend wiring without a legend', () => {
    render(
      <FormGroup>
        <Checkbox label="One" />
        <Checkbox label="Two" />
      </FormGroup>,
    );
    const group = screen.getByRole('group');
    expect(group).not.toHaveAttribute('aria-labelledby');
    expect(group.querySelector('legend')).toBeNull();
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes.map((box) => box.getAttribute('aria-labelledby') ?? box.textContent)).toHaveLength(2);
    expect(screen.getAllByText(/One|Two/).map((el) => el.textContent)).toEqual(['One', 'Two']);
  });

  it('disables controls wrapped in nested FormControlLabel and FormControl', () => {
    render(
      <FormGroup legend="Options" disabled>
        <FormControlLabel label="One">
          <Switch labelledByFormControl />
        </FormControlLabel>
        <FormControl>
          <FormLabel>Two</FormLabel>
          <Field.Control />
        </FormControl>
      </FormGroup>,
    );
    expect(screen.getByRole('group')).toBeDisabled();
    expect(screen.getByRole('group')).toHaveAttribute('data-disabled');
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByLabelText('Two')).toBeDisabled();
  });

  it('falsy legend content renders no legend element', () => {
    render(<FormGroup legend="">x</FormGroup>);
    expect(screen.getByRole('group').querySelector('legend')).toBeNull();
  });
});

function renderControlLabel(
  props: Partial<FormControlLabelProps> = {},
  control: ReactElement = <Switch labelledByFormControl />,
): ReturnType<typeof render> {
  return render(
    <FormControlLabel label="Allow header sorting" {...props}>
      {control}
    </FormControlLabel>,
  );
}

describe('FormControlLabel', () => {
  it('T9 toggles a wrapped native checkbox when the label text is clicked', async () => {
    renderControlLabel({}, <Field.Control type="checkbox" />);
    const checkbox = screen.getByRole('checkbox', {
      name: 'Allow header sorting',
    });
    await userEvent.click(screen.getByText('Allow header sorting'));
    expect(checkbox).toBeChecked();
  });

  it('T10 toggles a wrapped Switch when the label text is clicked', async () => {
    renderControlLabel({}, <Switch labelledByFormControl />);
    const toggle = screen.getByRole('switch', { name: 'Allow header sorting' });
    await userEvent.click(screen.getByText('Allow header sorting'));
    expect(toggle).toBeChecked();
  });

  it.todo('T11 selects a wrapped Radio inside a RadioGroup (Task 24)');

  it('T12 does not change a readOnly control', async () => {
    renderControlLabel({}, <Switch labelledByFormControl readOnly />);
    await userEvent.click(screen.getByText('Allow header sorting'));
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('T13 exposes labelPlacement and defaults to end', () => {
    const { unmount } = renderControlLabel();
    expect(screen.getByText('Allow header sorting').closest('label')).toHaveAttribute('data-label-placement', 'end');
    unmount();
    renderControlLabel({ labelPlacement: 'start' });
    expect(screen.getByText('Allow header sorting').closest('label')).toHaveAttribute('data-label-placement', 'start');
  });

  it('T14 disables the wrapped control and ignores clicks', async () => {
    renderControlLabel({ disabled: true });
    const checkbox = screen.getByRole('switch');
    expect(screen.getByText('Allow header sorting').closest('label')).toHaveAttribute('data-disabled');
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(screen.getByText('Allow header sorting'));
    expect(checkbox).not.toBeChecked();
  });

  it('T15 uses the visible text as the accessible name of the wrapped control', () => {
    renderControlLabel();
    expect(screen.getByRole('switch')).toHaveAccessibleName('Allow header sorting');
  });

  it('T16 renders 0 as label content and nothing for empty content', () => {
    const { unmount } = renderControlLabel({ label: 0 });
    expect(screen.getByText('0')).toHaveClass('ps-FormControlLabel__text');
    unmount();
    renderControlLabel({ label: '' });
    expect(document.querySelector('.ps-FormControlLabel__text')).toBeNull();
  });

  it('T22 keeps the label out of the tab order and toggles with Space', async () => {
    renderControlLabel();
    await userEvent.tab();
    const checkbox = screen.getByRole('switch');
    expect(checkbox).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(checkbox).toBeChecked();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });
});

describe('prop combinations', () => {
  it('FormControl merges className and style props and keeps them off the DOM', () => {
    render(
      <FormControl className="custom" p="md" width={200} flex={1} display="inline-flex" data-testid="root">
        <input aria-label="x" />
      </FormControl>,
    );
    const root = screen.getByTestId('root');
    expect(root).toHaveClass('ps-FormControl', 'custom', 'ps-p', 'ps-width', 'ps-flex', 'ps-display');
    expect(root).toHaveStyle({
      '--ps-p': 'var(--perses-spacing-md)',
      '--ps-width': '200px',
      '--ps-flex': '1',
      '--ps-display': 'inline-flex',
    });
    for (const attr of ['p', 'width', 'flex', 'display']) expect(root).not.toHaveAttribute(attr);
  });

  it('FormControl lets style win over computed style and supports responsive values', () => {
    render(
      <FormControl width={{ default: '100%', md: '20rem' }} style={{ '--ps-width': '1px' }} data-testid="root">
        <input aria-label="x" />
      </FormControl>,
    );
    expect(screen.getByTestId('root')).toHaveStyle({
      '--ps-width': '1px',
      '--ps-width-md': '20rem',
    });
  });

  it('FormGroup accepts spacing, sizing, flexbox and display props', () => {
    render(
      <FormGroup m="sm" minWidth={120} gap="xs" display="grid">
        x
      </FormGroup>,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveClass('ps-m', 'ps-min-width', 'ps-gap', 'ps-display');
    expect(group).not.toHaveAttribute('gap');
  });

  it('FormLabel and FormHelperText accept spacing props only', () => {
    render(
      <FormControl>
        <FormLabel mb="xs">Name</FormLabel>
        <Field.Control />
        <FormHelperText mt="sm">Hint</FormHelperText>
      </FormControl>,
    );
    expect(getLabel()).toHaveClass('ps-mb');
    expect(getLabel()).toHaveStyle({ '--ps-mb': 'var(--perses-spacing-xs)' });
    expect(getHelper()).toHaveClass('ps-mt');
    expect(getHelper()).not.toHaveAttribute('mt');
  });

  it('FormLabel rejects sizing props at the type level', () => {
    render(
      <FormControl>
        {/* @ts-expect-error width is not a FormLabel style prop */}
        <FormLabel width={100}>Name</FormLabel>
        <Field.Control />
      </FormControl>,
    );
    expect(getLabel()).not.toHaveClass('ps-width');
  });

  it('FormControl disabled with an onClick still fires the click on the root', async () => {
    const onClick = vi.fn();
    render(
      <FormControl disabled onClick={onClick} data-testid="root">
        <Field.Control />
      </FormControl>,
    );
    await userEvent.click(screen.getByTestId('root'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('FormControlLabel ignores false and null label content', () => {
    render(
      <FormControlLabel label={false}>
        <Checkbox aria-label="Only" />
      </FormControlLabel>,
    );
    expect(document.querySelector('.ps-FormControlLabel__text')).toBeNull();
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Only');
  });

  it('FormControlLabel merges className and spacing props on the label element', () => {
    render(
      <FormControlLabel label="A" className="custom" mt="md">
        <Switch labelledByFormControl />
      </FormControlLabel>,
    );
    const label = screen.getByText('A').closest('label');
    expect(label).toHaveClass('ps-FormControlLabel', 'custom', 'ps-mt');
    expect(label).not.toHaveAttribute('mt');
  });
});

function FieldOverrideConsumer(): ReactElement {
  const {
    components: {
      FormControl: Control,
      FormLabel: Label,
      FormHelperText: HelperText,
      FormGroup: Group,
      FormControlLabel: ControlLabel,
    },
  } = useComponents();
  return (
    <Group legend="Group">
      <Control>
        <Label>Name</Label>
        <Field.Control />
        <HelperText>Hint</HelperText>
      </Control>
      <ControlLabel label="Toggle">
        <Switch labelledByFormControl />
      </ControlLabel>
    </Group>
  );
}

describe('ComponentsProvider', () => {
  it('T23 renders overrides for every Field part', () => {
    const CustomLabel = forwardRef<HTMLLabelElement, { children?: ReactNode }>(function CustomLabel({ children }, ref) {
      return (
        <label ref={ref} data-testid="custom-label">
          {children}
        </label>
      );
    });

    render(
      <ComponentsProvider components={{ ...defaultComponents, FormLabel: CustomLabel }} icons={defaultIcons}>
        <FieldOverrideConsumer />
      </ComponentsProvider>,
    );

    expect(screen.getByTestId('custom-label')).toHaveTextContent('Name');
    expect(screen.getByRole('group', { name: 'Group' })).toBeInTheDocument();
    expect(screen.getByText('Hint')).toHaveClass('ps-FormHelperText');
    expect(screen.getByRole('switch', { name: 'Toggle' })).toBeInTheDocument();
  });

  it('T24 forwards refs to the underlying elements', () => {
    const control = createRef<HTMLDivElement>();
    const label = createRef<HTMLLabelElement>();
    const helper = createRef<HTMLParagraphElement>();
    const group = createRef<HTMLFieldSetElement>();
    const controlLabel = createRef<HTMLLabelElement>();
    render(
      <FormGroup ref={group}>
        <FormControl ref={control}>
          <FormLabel ref={label}>Name</FormLabel>
          <Field.Control />
          <FormHelperText ref={helper}>Hint</FormHelperText>
        </FormControl>
        <FormControlLabel ref={controlLabel} label="Toggle">
          <Switch labelledByFormControl />
        </FormControlLabel>
      </FormGroup>,
    );
    expect(control.current?.tagName).toBe('DIV');
    expect(label.current?.tagName).toBe('LABEL');
    expect(helper.current?.tagName).toBe('P');
    expect(group.current?.tagName).toBe('FIELDSET');
    expect(controlLabel.current?.tagName).toBe('LABEL');
  });
});
