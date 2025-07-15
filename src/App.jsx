import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import styles from './App.module.css';
import './App.css';
import TodosPage from './pages/TodosPage/TodosPage';
import About from './pages/About/About';
import Header from './shared/Header';
import NotFound from './pages/NotFound/NotFound';

// const token = `Bearer ${import.meta.env.VITE_PAT}`;

const urlBase = import.meta.env.VITE_BASE_URL;
let sessionFetchInProgress = false;
function AuthPage({
  logonState,
  sessionState,
  setSessionState,
  setLogonState,
  startLogonTimer,
  fetchLogonState,
}) {
  const onLoginSuccess = (userName, csrfToken) => {
    setLogonState({ userName, csrfToken });
    setSessionState(3);
  };
  const navigate = useNavigate();
  let viewToShow = 'default';
  if (sessionState === 0) {
    viewToShow = 'checkLogon';
    if (!sessionFetchInProgress) {
      sessionFetchInProgress = true;
      fetchLogonState();
    }
  }
  const [view, setView] = useState(viewToShow);
  const [logonError, setLogonError] = useState(null);
  const [registerError, setRegisterError] = useState(null);
  let timeoutNoticeValue = null;
  if (sessionState === 1) {
    timeoutNoticeValue = 'Your logon session has timed out.';
  }
  const [timeoutNotice, setTimeoutNotice] = useState(timeoutNoticeValue);
  const handleLogonSubmit = async (email, password) => {
    let res;
    let data;
    try {
      res = await fetch(`${urlBase}/user/logon`, {
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
      data = await res.json();
      console.log("status and json", res.status, JSON.stringify(data))
      if (res.status === 200 && data.name && data.csrfToken) {
        onLoginSuccess(data.name, data.csrfToken);
      } else {
        setLogonError('Authentication failed.');
      }
    } catch (err) {
      setLogonError(`Error on fetch: ${err.name} ${err.message}`);
    }
  };
  const handleRegisterSubmit = async (name, email, password) => {
    let res;
    let data;
    try {
      res = await fetch(`${urlBase}/user/register`, {
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
      data = await res.json();
      if (res.status === 201 && data.name && data.csrfToken) {
        onLoginSuccess(data.name, data.csrfToken);
        // navigate('/');
      } else if (res.status === 400 && data.message) {
        setRegisterError(data.message);
      } else {
        setRegisterError('unexpected response');
      }
    } catch (err) {
      setRegisterError(`Error on fetch: ${err.name} ${err.message}`);
    }
  };

  useEffect(() => {
    if (logonState && logonState.userName && logonState.csrfToken) {
      startLogonTimer();
      navigate('/');
    } else if (sessionState === 1 || sessionState === 2) {
      setView('default');
    }
  }, [logonState, sessionState, startLogonTimer]);

  return (
    <>
      {view === 'default' && (
        <>
          <button
            onClick={() => {
              setTimeoutNotice(null);
              setView('logon');
            }}
          >
            Logon
          </button>
          <button
            onClick={() => {
              setTimeoutNotice(null);
              setView('register');
            }}
          >
            Register
          </button>
          <br></br>
          <br></br>
          {timeoutNotice && <p>{timeoutNotice}</p>}
        </>
      )}
      {view === 'logon' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const values = e.target.elements;
            handleLogonSubmit(values.email.value, values.password.value);
          }}
        >
          <p>Log On:</p>
          <label htmlFor="email">Email: </label>
          <input name="email" placeholder="Email" />
          <br></br>
          <label htmlFor="password3">Password: </label>
          <input id="password3" name="password" type="password" />
          <br></br>
          <button type="submit">Submit</button>
          <button
            type="button"
            onClick={() => {
              setLogonError(null);
              setView('default');
            }}
          >
            Cancel
          </button>
          {logonError && <p>{logonError}</p>}
        </form>
      )}
      {view === 'register' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const values = e.target.elements;
            if (values.password.value != values.passwordConfirmation.value) {
              setRegisterError("The passwords entered didn't match.");
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
          <input name="name" id="name" placeholder="Name" />
          <br></br>
          <label htmlFor="email">Your Email: </label>
          <input id="email" name="email" placeholder="Email" />
          <br></br>
          <label htmlFor="password1">Your New Password: </label>
          <input id="password1" name="password" type="password" />
          <label htmlFor="password2">Confirm Your Password: </label>
          <input id="password2" name="passwordConfirmation" type="password" />
          <button type="submit">Submit</button>
          <button
            type="button"
            onClick={() => {
              setRegisterError(null);
              setView('default');
            }}
          >
            Cancel
          </button>
          {registerError && <p>{registerError}</p>}
        </form>
      )}
      {view === 'checkingLogon' && <p>Checking logon state...</p>}
    </>
  );
}

function App() {
  const [logonState, setLogonState] = useState(null); // stores the userName and the csrfToken
  const [logoffError, setLogoffError] = useState(null);
  const [sessionState, setSessionState] = useState(0);
  const startLogonTimer = async () => {
    while (sessionState === 3) {
      // while logged on
      let timeoutPromise = new Promise((resolve) => {
        setTimeout(resolve, 5 * 60 * 1000); // Every 5 minutes
      });
      await timeoutPromise;
      if (!sessionFetchInProgress) {
        sessionFetchInProgress = true;
        fetchLogonState();
      }
    }
  };
  const fetchLogonState = async () => {
    let resultSet = false;
    try {
      const res = await fetch('/api/user/nameAndToken', {
        method: 'GET',
        credentials: 'include',
      });

      const data = res.status === 200 ? await res.json() : null;

      if (data?.name && data?.csrfToken) {
        resultSet = true;
        setSessionState(3);
        setLogonState({ userName: data.name, csrfToken: data.csrfToken });
      }
    } catch {
      // console.log('Fetch failed:', err.name, err.message);
    } finally {
      if (!resultSet) {
        // if we didn't get back good values
        if (sessionState === 3) {
          setSessionState(1); // must have timed out
        } else if (sessionState === 0) {
          // initial query
          setSessionState(2);
        }
        if (logonState) {
          setLogonState(null);
        }
      }
      sessionFetchInProgress = false;
    }
  };
  // session state values:
  // 0: unknown.  The user may or may not have a valid cookie
  // 1: timed out.  The cookie is no longer valid
  // 2: logged off.  The user is known to be logged off.  They either logged off intentionally or they never logged on.
  // 3: logged on.  The user has a valid cookie, although it may have timed out recently.

  const onLogoffSuccess = () => {
    setLogonState(null);
    setSessionState(2); // logged off
  };

  const handleLogoff = async () => {
    if (logonState) {
      try {
        const res = await fetch(`${urlBase}/user/logoff`, {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': logonState.csrfToken,
          },
          credentials: 'include',
        });

        if (res.status === 200 || res.status === 401) {
          onLogoffSuccess();
        } else {
          const data = await res.json();
          setLogoffError(data.message || 'Logoff failed');
        }
      } catch (err) {
        setLogoffError(`Error on fetch: ${err.name} ${err.message}`);
      }
    } else {
      setSessionState(2);
    }
  };
  const onUnauthorized = () => {
    setSessionState(1); // the session probably timed out
    setLogonState(null);
  };

  return (
    <div className={styles.wrapper}>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            logonState ? (
              <TodosPage
                urlBase={urlBase}
                handleLogoff={handleLogoff}
                logonState={logonState}
                styles={styles}
                onUnauthorized={onUnauthorized}
                logoffError={logoffError}
              />
            ) : (
              <Navigate to="/logonRegister" />
            )
          }
        />
        <Route
          path="/logonRegister"
          element={
            <AuthPage
              logonState={logonState}
              sessionState={sessionState}
              setLogonState={setLogonState}
              setSessionState={setSessionState}
              startLogonTimer={startLogonTimer}
              fetchLogonState={fetchLogonState}
            />
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
