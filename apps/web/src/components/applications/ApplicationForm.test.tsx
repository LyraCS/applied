// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApplicationForm, emptyFormValues } from './ApplicationForm'

afterEach(cleanup)

describe('ApplicationForm', () => {
  it('blocks submit and explains the two required fields', async () => {
    const onSubmit = vi.fn()
    render(
      <ApplicationForm
        defaultValues={emptyFormValues}
        submitLabel="Save application"
        onSubmit={onSubmit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save application' }))

    // The message appears inline and in the focusable summary at the top.
    expect((await screen.findAllByText('Company is required')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Position is required').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'There is a problem' })).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sends blank optional fields as null, not empty strings', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <ApplicationForm
        defaultValues={emptyFormValues}
        submitLabel="Save application"
        onSubmit={onSubmit}
      />,
    )

    fireEvent.change(screen.getByLabelText(/company/i), { target: { value: 'Acme' } })
    fireEvent.change(screen.getByLabelText(/position/i), { target: { value: 'Engineer' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save application' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      company: 'Acme',
      position: 'Engineer',
      status: 'SAVED',
      appliedAt: null,
      portalUrl: null,
      hiringContact: null,
      location: null,
      jobDescription: null,
      qualifications: null,
      salary: null,
      jobType: null,
      notes: null,
    })
  })
})
