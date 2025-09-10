import { render, screen, fireEvent } from '@testing-library/react'
import { Toggle, ToggleGroup } from '../Toggle'

describe('Toggle Components', () => {
  it('renders Toggle with label', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Test Toggle" />)
    expect(screen.getByLabelText('Test Toggle')).toBeInTheDocument()
  })

  it('renders Toggle with helper text', () => {
    render(
      <Toggle 
        checked={false} 
        onChange={() => {}} 
        label="Test Toggle"
        helperText="Helper text"
      />
    )
    expect(screen.getByText('Helper text')).toBeInTheDocument()
  })

  it('handles toggle state changes', () => {
    const handleChange = jest.fn()
    render(<Toggle checked={false} onChange={handleChange} label="Test Toggle" />)
    
    const toggle = screen.getByLabelText('Test Toggle')
    fireEvent.click(toggle)
    
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('renders as disabled when disabled prop is true', () => {
    render(<Toggle checked={false} onChange={() => {}} disabled />)
    const toggle = screen.getByRole('checkbox')
    expect(toggle).toBeDisabled()
  })

  it('renders ToggleGroup with children', () => {
    render(
      <ToggleGroup>
        <Toggle checked={false} onChange={() => {}} label="Toggle 1" />
        <Toggle checked={true} onChange={() => {}} label="Toggle 2" />
      </ToggleGroup>
    )
    
    expect(screen.getByLabelText('Toggle 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Toggle 2')).toBeInTheDocument()
  })

  it('applies custom className to ToggleGroup', () => {
    render(
      <ToggleGroup className="custom-class">
        <Toggle checked={false} onChange={() => {}} label="Test" />
      </ToggleGroup>
    )
    
    const group = screen.getByLabelText('Test').closest('.custom-class')
    expect(group).toBeInTheDocument()
  })
})
