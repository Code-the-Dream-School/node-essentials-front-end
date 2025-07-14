import { useState, useEffect } from 'react';
import {
  useNavigate,
  useLocation,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import styles from './App.module.css';
import './App.css';

import TodosPage from './pages/TodosPage/TodosPage';
import About from './pages/About/About';
import Header from './shared/Header';
import NotFound from './pages/NotFound/NotFound';

// const token = `Bearer ${import.meta.env.VITE_PAT}`;

const urlBase = import.meta.env.VITE_BASE_URL;
function AuthPage({ onLoginSuccess, logonState }) {
  const navigate = useNavigate();
  const [view, setView] = useState('default');
  const [logonError, setLogonError] = useState(null);
  const [registerError, setRegisterError] = useState(null);
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
      });
      data = await res.json();
      if (res.status === 200 && data.name && data.csrfToken) {
        onLoginSuccess(data.name, data.csrfToken);
        // navigate('/');
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
    console.log(`${urlBase}/user/register`);
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
      });
      data = await res.json();
      if (res.status === 201 && data.name && data.csrfToken) {
        onLoginSuccess(data.name, data.csrfToken);
        // navigate('/');
      } else if (res.status === 400 && data.message) {
        setRegisterError(data.message);
      } else {
        console.log(`Return from register call ${res.status}`);
        setRegisterError('unexpected response');
      }
    } catch (err) {
      setRegisterError(`Error on fetch: ${err.name} ${err.message}`);
    }
  };
  useEffect(() => {
    if (logonState) {
      navigate('/');
    }
  }, [logonState, navigate]);

  return (
    <>
      {view === 'default' && (
        <>
          <button onClick={() => setView('logon')}>Logon</button>
          <button onClick={() => setView('register')}>Register</button>
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
    </>
  );
}
function LogonStatePage({
  logonState,
  setLogonState,
  setStateInitialized,
  stateInitialized,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!stateInitialized) {
      const fetchLogonState = async () => {
        try {
          const res = await fetch('/api/user/nameAndToken', {
            method: 'GET',
            credentials: 'include',
          });

          const data = res.status === 200 ? await res.json() : null;

          if (data?.name && data?.csrfToken) {
            setLogonState({ userName: data.name, csrfToken: data.csrfToken });
          }
        } catch (err) {
          console.log("Fetch failed:", err.name, err.message);
        } finally {
          setStateInitialized(true); 
        }
      };

      fetchLogonState();
    }
  }, [stateInitialized, setLogonState, setStateInitialized]);

  useEffect(() => {
    if (stateInitialized) {
      if (logonState) {
        navigate('/');
      } else {
        navigate('/logonRegister');
      }
    }
  }, [stateInitialized, logonState, navigate]);

  return (
    <>
      <p>Checking logon state...</p>
    </>
  );
}

function App() {
  const [logonState, setLogonState] = useState(null);
  const [logoffError, setLogoffError] = useState(null);
  const [stateInitialized, setStateInitialized] = useState(false);
  const [title, setTitle] = useState('Todo List');
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') {
      setTitle('Todo List');
    } else if (location.pathname === '/logonRegister') {
      setTitle('Todo List Logon')
    } else if (location.pathname === '/checkLogonState') {
      setTitle('Todo List: Checking with the Server')
    } else if (location.pathname === '/about') {
      setTitle('About');
    } else {
      setTitle('Not Found');
    }
  }, [location]);

  const onLoginSuccess = (userName, csrfToken) => {
    setLogonState(userName, csrfToken);
  };

  const onLogoffSuccess = () => {
    setLogonState(null);
  };

  const handleLogoff = async () => {
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
  };

  return (
    <div className={styles.wrapper}>
      <Header title={title} />
      <Routes>
        <Route
          path="/"
          element={
            logonState ? (
              <TodosPage
                urlBase={urlBase}
                handleLogoff={handleLogoff}
                logoffError={logoffError}
                logonState={logonState}
                styles={styles}
              />
            ) : (
              
              < Navigate to="/checkLogonState" />
            )
          }
        />
        <Route
          path="/checkLogonState"
          element={
            <LogonStatePage
                stateInitialized={stateInitialized}
                setStateInitialized={setStateInitialized}
                setLogonState={setLogonState}
                logonState={logonState}
                />
          }
        />
        <Route
          path="/logonRegister"
          element={
            <AuthPage onLoginSuccess={onLoginSuccess} logonState={logonState} />
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
