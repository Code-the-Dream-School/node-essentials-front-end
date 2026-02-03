import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from '../src/shared/Header.jsx';
import { context as UserContext } from '../src/reducers/user.reducer.js';
import { BrowserRouter } from 'react-router-dom';

let mockPathname = '/logon';

// Mock useLocation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(() => ({
      pathname: mockPathname,
      state: null,
      search: '',
      hash: ''
    }))
  };
});

describe('Header Component', () => {
  const mockDispatch = vi.fn();
  const mockUserState = {
    isLoading: false,
    errorMessage: '',
    userData: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (userState = mockUserState, pathname) => {
    mockPathname = pathname;
    return render(
      <UserContext.Provider value={{ dispatch: mockDispatch, userState }}>
        <BrowserRouter>
          <Header />
        </BrowserRouter>
      </UserContext.Provider>
    );
  };

  it('renders home page', () => {
    renderComponent(mockUserState, '/');
    expect(screen.getByText('Todo List')).toBeInTheDocument();
  });

  it('renders login page', () => {
    renderComponent(mockUserState, '/logon');
    expect(screen.getByText('Todo List Logon')).toBeInTheDocument();
  });

  it('renders register page', () => {
    renderComponent(mockUserState, '/register');
    expect(screen.getByText('Todo List Register')).toBeInTheDocument();
  });

});