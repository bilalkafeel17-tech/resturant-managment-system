import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import App from '../App.jsx';

describe('Servora Frontend App Suite', () => {
  it('renders login page and branding title by default when unauthenticated', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText(/Servora/i)).toBeInTheDocument();
    expect(screen.getByText(/Restaurant Operations, Made Simpler/i)).toBeInTheDocument();
    expect(screen.getByText(/One-Click Demo Credentials/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Workspace/i })).toBeInTheDocument();
  });
});
