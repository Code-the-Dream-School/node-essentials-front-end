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

function AuthPage({
  logonState,
  establishLogonState,
  timeoutNotice,
  setTimeoutNotice
}) {

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
        credentials: 'include',
      });
      data = await res.json();
      console.log("status and json", res.status, JSON.stringify(data))
      if (res.status === 200 && data.name && data.csrfToken) {
        establishLogonState(data.name, data.csrfToken);
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
      res = await fetch(`${urlBase}/user`, {
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
        establishLogonState(data.name, data.csrfToken);
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
    if (logonState) {
      navigate('/');
    } 
  }, [logonState]);

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
    </>
  );
}

function App() {
   // stores the userName and the csrfToken
  const [logoffError, setLogoffError] = useState(null);
  const [timeoutNotice, setTimeoutNotice] = useState(null);
  const currentUserName = localStorage.getItem("userName");
  const currentCsrfToken = localStorage.getItem("csrfToken");
  let initialLogonState = null;
  if (currentUserName && currentCsrfToken) {
    initialLogonState = {userName: currentUserName, csrfToken: currentCsrfToken}
  }
  const [logonState, setLogonState] = useState(initialLogonState);

  const establishLogonState = (userName, csrfToken) => {
    localStorage.setItem("userName", userName);
    localStorage.setItem("csrfToken", csrfToken);
    setLogonState({userName, csrfToken})
  }
  const clearLogonState = () => { 
    localStorage.removeItem("userName");
    localStorage.removeItem("csrfToken");
    setLogonState(null);
  } 

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
          clearLogonState();
        } else {
          const data = await res.json();
          setLogoffError(data.message || 'Logoff failed');
        }
      } catch (err) {
        setLogoffError(`Error on fetch: ${err.name} ${err.message}`);
      }
    }
  };
  const onUnauthorized = () => {
    setTimeoutNotice("Your session has timed out.")
    clearLogonState(); // this triggers the Todo page to navigate back to /logonRegister
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
              establishLogonState={establishLogonState}
              timeoutNotice={timeoutNotice}
              setTimeoutNotice={setTimeoutNotice}
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
