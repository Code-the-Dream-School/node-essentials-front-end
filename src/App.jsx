import {useReducer} from 'react';
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
  initialState as initialUserState,
  context as UserContext,
} from './reducers/user.reducer';

// const token = `Bearer ${import.meta.env.VITE_PAT}`;

function App() {
  const [userState, dispatch] = useReducer(userReducer, initialUserState);

  return (
    <UserContext.Provider value={{ userState, dispatch }}>
      <div className={styles.wrapper}>
        <Header />
        <Routes>
          <Route
            path="/"
            element={
              userState && userState.userData ? (
                <TodosPage />
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
