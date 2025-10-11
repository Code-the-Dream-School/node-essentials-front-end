import {useContext} from 'react';
import {useNavigate} from 'react-router-dom';
import AuthGoogleButton from './AuthGoogleButton';
import {actions as userActions, context as UserContext} from '../../reducers/user.reducer.js';

function AuthPlaceholder() {
  const navigate = useNavigate();
  const {dispatch, userState} = useContext(UserContext);

  const clearError = () => {
    dispatch({type: userActions.clearAuthError});
  };

  return (
    <>
      {!userState?.isLoading ? (
        <>
          <button
            onClick={() => {
              clearError();
              navigate('/logon');
            }}
          >
            Logon
          </button>
          <button
            onClick={() => {
              clearError();
              navigate('/register');
            }}
          >
            Register
          </button>
          <br></br>
          <AuthGoogleButton />
          <br></br>
          <br></br>
          {userState?.errorMessage && <p>{userState?.errorMessage}</p>}
        </>
      ) : (
        <p>Authorization...</p>
      )}
    </>
  );
}

export default AuthPlaceholder;
