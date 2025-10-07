import {useContext} from 'react';
import {useNavigate} from 'react-router-dom';
import {useGoogleLogin} from '@react-oauth/google';
import {actions as userActions, context as UserContext} from '../../reducers/user.reducer.js';

const urlBase = import.meta.env.VITE_BASE_URL;

function AuthGoogleButton() {
  const navigate = useNavigate();
  const {dispatch} = useContext(UserContext);

  const handleGoogleLogon = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        dispatch({ type: userActions.fetchUser });
        const res = await fetch(`${urlBase}/user/googleLogon`, {
          body: JSON.stringify({
            code: codeResponse.code
          }),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        const data = await res.json();
        if (res.status === 200 && data.name && data.csrfToken) {
          dispatch({ type: userActions.loadUser, payload: data });
          navigate('/');
        } else {
          setError(`Authentication failed: ${data?.message}`);
        }
      } catch (err) {
        setError(`Error on fetch: ${err.name} ${err.message}`);
      }
    },
    onError: async (googleLogonError) => {
      console.log(googleLogonError);
    },
    flow: 'auth-code',
    scope: 'openid email profile',
  });

  const setError = (error) => {
    dispatch({type: userActions.setAuthError, error: error});
  };

  return (
    <button
      onClick={handleGoogleLogon}
    >
      Logon with Google
    </button>
  );
}

export default AuthGoogleButton;
