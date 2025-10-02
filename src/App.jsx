import {useState, useReducer} from 'react';
import { Routes, Route } from 'react-router-dom';
import styles from './App.module.css';
import './App.css';
import TodosPage from './pages/TodosPage/TodosPage';
import About from './pages/About/About';
import Header from './shared/Header';
import NotFound from './pages/NotFound/NotFound';
import Logon from './pages/Logon/Logon';
import Register from './pages/Register/Register';
import AuthPlaceholder from './features/AuthPlaceholder/AuthPlaceholder';
import {
  reducer as userReducer,
  actions as userActions,
  initialState as initialUserState,
  context as UserContext,
} from './reducers/user.reducer';

// const token = `Bearer ${import.meta.env.VITE_PAT}`;

const urlBase = import.meta.env.VITE_BASE_URL;

function App() {
  const [logoffError, setLogoffError] = useState(null);
  const [userState, dispatch] = useReducer(userReducer, initialUserState);

  const handleLogoff = async () => {
    if (userState && userState.userData) {
      try {
        const res = await fetch(`${urlBase}/user/logoff`, {
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
          setLogoffError(data.message || 'Logoff failed');
        }
      } catch (err) {
        setLogoffError(`Error on fetch: ${err.name} ${err.message}`);
      }
    }
  };


  return (
    <UserContext.Provider value={{ userState, dispatch }}>
      <div className={styles.wrapper}>
        <Header />
        <Routes>
          <Route
            path="/"
            element={
              userState && userState.userData ? (
                <TodosPage
                  urlBase={urlBase}
                  handleLogoff={handleLogoff}
                  logonState={userState.userData}
                  logoffError={logoffError}
                />
              ) : (
                <AuthPlaceholder />
              )
            }
          />
          <Route
            path="/logon"
            element={
              <Logon />
            }
          />
          <Route
            path="/register"
            element={
              <Register />
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </UserContext.Provider>
  );
}

export default App;
