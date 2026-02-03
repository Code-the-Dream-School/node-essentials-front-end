import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Logon from '../src/pages/Logon/Logon.jsx';
import { context as UserContext, actions as userActions } from '../src/reducers/user.reducer.js';
import { BrowserRouter } from 'react-router-dom';

// Mock useNavigate
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// Mock fetch
global.fetch = vi.fn();

describe('Logon Component', () => {
  const mockDispatch = vi.fn();
  const mockUserState = {
    isLoading: false,
    errorMessage: '',
    userData: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (userState = mockUserState) => {
    return render(
      <UserContext.Provider value={{ dispatch: mockDispatch, userState }}>
        <BrowserRouter>
          <Logon />
        </BrowserRouter>
      </UserContext.Provider>
    );
  };

  it('renders login form', () => {
    renderComponent();
    expect(screen.getByText('Log On:')).toBeInTheDocument();
    // Email input doesn't have an id matching the label's htmlFor, so we find by placeholder
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('handles input changes', () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  it('submits form and navigates on success', async () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByLabelText('Password:');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    global.fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ name: 'Test User', csrfToken: 'token123' }),
    });

    fireEvent.click(submitButton);

    expect(mockDispatch).toHaveBeenCalledWith({ type: userActions.fetchUser });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/logon'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
    });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: userActions.loadUser,
        payload: { name: 'Test User', csrfToken: 'token123' },
      });
      expect(mockedNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles login failure', async () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByLabelText('Password:');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    global.fetch.mockResolvedValueOnce({
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: userActions.setAuthError,
        error: 'Authentication failed: Invalid credentials',
      });
    });
  });

  it('handles fetch error', async () => {
    renderComponent();
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: userActions.setAuthError,
        error: 'Error on fetch: Error Network error',
      });
    });
  });

  it('displays loading state', () => {
    renderComponent({ ...mockUserState, isLoading: true });
    expect(screen.getByText('Authorization...')).toBeInTheDocument();
    expect(screen.queryByText('Log On:')).not.toBeInTheDocument();
  });

  it('displays error message', () => {
    renderComponent({ ...mockUserState, errorMessage: 'Something went wrong' });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('clears auth error on unmount', () => {
    const { unmount } = renderComponent();
    unmount();
    expect(mockDispatch).toHaveBeenCalledWith({ type: userActions.clearAuthError });
  });

  it('navigates to home on cancel', () => {
    renderComponent();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);
    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });
});
