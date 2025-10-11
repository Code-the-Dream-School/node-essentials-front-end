import {useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  actions as userActions,
  context as UserContext,
} from '../../reducers/user.reducer';

const urlBase = import.meta.env.VITE_BASE_URL;

function Logon() {
  const navigate = useNavigate();
  const {dispatch, userState} = useContext(UserContext);

  const [userEmail, setUserEmail] = useState('');

  const handleLogonSubmit = async (email, password) => {
    try {
      dispatch({ type: userActions.fetchUser });
      const res = await fetch(`${urlBase}/user/logon`, {
        body: JSON.stringify({
          email,
          password,
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
  };

  const setError = (error) => {
    dispatch({type: userActions.setAuthError, error: error});
  };

  useEffect(() => {
    return () => {
      // clear auth error on component destruction (page changed)
      dispatch({type: userActions.clearAuthError});
    };
  }, [dispatch]);

  return (
    <>
      {!userState?.isLoading ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const values = e.target.elements;
            handleLogonSubmit(values.email.value, values.password.value);
          }}
        >
          <p>Log On:</p>
          <label htmlFor="email">Email: </label>
          <input
            name="email"
            placeholder="Email"
            value={userEmail}
            onChange={(e) => {setUserEmail(e.target.value);}}
          />
          <br></br>
          <label htmlFor="password3">Password: </label>
          <input id="password3" name="password" type="password"/>
          <br></br>
          <button type="submit">Submit</button>
          <button
            type="button"
            onClick={() => {
              navigate('/');
            }}
          >
            Cancel
          </button>
          {userState?.errorMessage && <p>{userState?.errorMessage}</p>}
        </form>
      ) : (
        <p>Authorization...</p>
      )}
    </>
  );
}

export default Logon;
