import {useContext, useState} from 'react';
import {actions as userActions, context as UserContext} from '../../reducers/user.reducer.js';

const urlBase = import.meta.env.VITE_BASE_URL;

function AuthLogoff() {
  const {dispatch, userState} = useContext(UserContext);
  const [errorTimeout, setErrorTimeout] = useState(null);

  const handleLogoff = async () => {
    if (userState && userState.userData) {
      try {
        dispatch({ type: userActions.fetchUser });
        const res = await fetch(`${urlBase}/api/users/logoff`, {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': userState.userData.csrfToken,
          },
          credentials: 'include',
        });

        if (res.status === 200 || res.status === 401) {
          dispatch({ type: userActions.clearUser });
        } else {
          const data = await res.json();
          setError(data.message || 'Logoff failed');
        }
      } catch (err) {
        setError(`Error on fetch: ${err.name} ${err.message}`);
      }
    }
  };

  const setError = (error) => {
    dispatch({type: userActions.setAuthError, error: error});
    clearTimeout(errorTimeout);
    setErrorTimeout(setTimeout(() => {
      dispatch({type: userActions.clearAuthError});
    }, 7000));
  };

  return (
    <>
      <p>{userState?.userData?.name} is logged on.</p>
      {!userState.isLoading ?
        <button onClick={handleLogoff}>Logoff</button> :
        <button>Processing...</button>
      }
      {userState?.errorMessage && <p>{userState?.errorMessage}</p>}
    </>
  );
}

export default AuthLogoff;
