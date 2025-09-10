import { render, screen } from '@testing-library/react'
import { Input, Textarea } from '../Input'

describe('Input Components', () => {
  it('renders Input with label', () => {
    render(<Input label="Test Label" />)
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
  })

  it('renders Input with helper text', () => {
    render(<Input helperText="Helper text" />)
    expect(screen.getByText('Helper text')).toBeInTheDocument()
  })

  it('renders Input with error', () => {
    render(<Input error="Error message" />)
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders Textarea', () => {
    render(<Textarea label="Textarea Label" />)
    const textarea = screen.getByLabelText('Textarea Label')
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('associates label with input correctly', () => {
    render(<Input label="Email" id="email-input" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('id', 'email-input')
  })

  it('handles controlled input', () => {
    const handleChange = jest.fn()
    render(<Input value="test value" onChange={handleChange} />)
    const input = screen.getByDisplayValue('test value')
    expect(input).toBeInTheDocument()
  })
})
