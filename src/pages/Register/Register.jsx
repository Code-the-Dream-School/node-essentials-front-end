import {useContext, useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  actions as userActions,
  context as UserContext,
} from '../../reducers/user.reducer';

const urlBase = import.meta.env.VITE_BASE_URL;

function Register() {
  const navigate = useNavigate();
  const {dispatch, userState} = useContext(UserContext);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const handleRegisterSubmit = async (name, email, password) => {
    try {
      dispatch({ type: userActions.fetchUser });
      const res = await fetch(`${urlBase}/user`, {
        body: JSON.stringify({
          name,
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
      if (res.status === 201 && data.name && data.csrfToken) {
        dispatch({ type: userActions.loadUser, payload: data });
        navigate('/');
      } else if (res.status === 400 && data.message) {
        setError(data.message);
      } else {
        setError('Unexpected response');
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
            if (values.password.value !== values.passwordConfirmation.value) {
              setError('The passwords entered didn\'t match.');
              return;
            }
            handleRegisterSubmit(
              values.name.value,
              values.email.value,
              values.password.value
            );
          }}
        >
          <p>Register as a New User:</p>
          <label htmlFor="name">Your Name: </label>
          <input
            name="name"
            id="name"
            value={userName}
            onChange={(e) => {setUserName(e.target.value);}}
            placeholder="Name"
          />
          <br></br>
          <label htmlFor="email">Your Email: </label>
          <input
            id="email"
            name="email"
            value={userEmail}
            onChange={(e) => {setUserEmail(e.target.value);}}
            placeholder="Email"
          />
          <br></br>
          <label htmlFor="password1">Your New Password: </label>
          <input id="password1" name="password" type="password"/>
          <br></br>
          <label htmlFor="password2">Confirm Your Password: </label>
          <input id="password2" name="passwordConfirmation" type="password"/>
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

export default Register;
