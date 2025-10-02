import {createContext} from 'react';

const actions = {
  fetchUser: 'fetchUser',
  loadUser: 'loadUser',
  clearUser: 'clearUser',
  setAuthError: 'setAuthError',
  clearAuthError: 'clearAuthError',
};

const currentUserName = localStorage.getItem('userName');
const currentCsrfToken = localStorage.getItem('csrfToken');

const initialState = {
  userData: (currentUserName && currentCsrfToken) ? {
    name: currentUserName,
    csrfToken: currentCsrfToken
  } : null,
  isLoading: false,
  errorMessage: ''
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case actions.fetchUser:
      return {
        ...state,
        isLoading: true,
      };
    case actions.loadUser:
      localStorage.setItem('userName', action.payload.name);
      localStorage.setItem('csrfToken', action.payload.csrfToken);
      return {
        ...state,
        userData: {
          name: action.payload.name,
          csrfToken: action.payload.csrfToken,
        },
        isLoading: false,
        errorMessage: '',
      };
    case actions.clearUser:
      localStorage.removeItem('userName');
      localStorage.removeItem('csrfToken');
      return {
        ...state,
        userData: null,
        isLoading: false,
      };
    case actions.setAuthError:
      return {
        ...state,
        errorMessage: action.error,
        isLoading: false,
      };
    case actions.clearAuthError:
      return {
        ...state,
        errorMessage: '',
      };
  }
}

const context = createContext();

export { actions, initialState, reducer, context };
