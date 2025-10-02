import {useCallback, useContext, useEffect, useReducer, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import TodoForm from '../../features/TodoForm';
import TodoList from '../../features/TodoList/TodoList';
import TodosViewForm from '../../features/TodosViewForm';
import {
  actions as userActions,
  context as userContext
} from '../../reducers/user.reducer.js';
import {
  reducer as todosReducer,
  actions as todoActions,
  initialState as initialTodosState,
} from '../../reducers/todos.reducer';
import styles from '../../App.module.css';

function TodosPage({
  logonState,
  urlBase,
  logoffError,
  handleLogoff,
}) {
  const navigate = useNavigate();

  const [sortDirection, setSortDirection] = useState('desc');
  const [sortField, setSortField] = useState('createdTime');
  const [queryString, setQueryString] = useState('');
  const [todoState, dispatch] = useReducer(todosReducer, initialTodosState);
  const {dispatch: dispatchUser} = useContext(userContext);

  //pessimistic
  const addTodo = async (newTodo) => {
    const payload = {
      // records: [
      //   {
      //     fields: {
      //       title: newTodo.title,
      //       isCompleted: newTodo.isCompleted,
      //     },
      //   },
      // ],
      title: newTodo.title,
      isCompleted: newTodo.isCompleted,
    };
    const options = {
      method: 'POST',
      headers: {
        // Authorization: token,
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': logonState.csrfToken,
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    };

    try {
      dispatch({ type: todoActions.startRequest });
      const resp = await fetch(encodeUrl(), options);
      if (resp.status === 401) {
        // credential timed out
        return onUnauthorized();
      }
      if (!resp.ok) {
        throw new Error(resp.error);
      }
      const task = await resp.json();
      const records = [{ id: task.id, fields: task }];
      delete records[0].fields.id;
      // const { records } = await resp.json();
      dispatch({ type: todoActions.addTodo, records });
    } catch (error) {
      dispatch({ type: todoActions.setLoadError, error });
    } finally {
      dispatch({ type: todoActions.endRequest });
    }
  };

  //optimistic - uses catch to revert
  const updateTodo = async (editedTodo) => {
    const originalTodo = todoState.todoList.find(
      (todo) => todo.id === editedTodo.id
    );
    dispatch({ type: todoActions.updateTodo, editedTodo });

    try {
      const payload = {
        // records: [
        //   {
        //     id: editedTodo.id,
        //     fields: {
        //       //explicitly only want these fields
        //       title: editedTodo.title,
        //       createdTime: editedTodo.createdTime,
        //       isCompleted: editedTodo.isCompleted,
        //     },
        //   },
        // ],
        title: editedTodo.title,
        createdTime: editedTodo.createdTime,
        isCompleted: editedTodo.isCompleted,
      };
      const options = {
        method: 'PATCH',
        headers: {
          // Authorization: token,
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': logonState.csrfToken,
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      };

      // const resp = await fetch(encodeUrl(), options);
      const resp = await fetch(`${urlBase}/tasks/${editedTodo.id}`, options);
      if (resp.status === 401) {
        return onUnauthorized();
      }
      if (!resp.ok) {
        throw new Error(resp.error);
      }
    } catch (error) {
      dispatch({
        type: todoActions.revertTodo,
        editedTodo: originalTodo,
        error,
      });
    } finally {
      dispatch({ type: todoActions.endRequest });
    }
  };

  //optimistic - uses catch to revert
  const completeTodo = async (id) => {
    const [originalTodo] = todoState.todoList.filter((todo) => todo.id === id);

    dispatch({ type: todoActions.completeTodo, id });

    try {
      const payload = {
        // records: [
        //   {
        //     id: id,
        //     fields: {
        //       isCompleted: true,
        //     },
        //   },
        // ],
        isCompleted: true,
      };
      const options = {
        method: 'PATCH',
        headers: {
          // Authorization: token,
          'Content-Type': 'application/json',
          'X-CSRF-Token': logonState.csrfToken,
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      };
      const resp = await fetch(`${urlBase}/tasks/${id}`, options);
      if (resp.status === 401) {
        return onUnauthorized();
      }
      if (!resp.ok) {
        throw new Error(resp.error);
      }
    } catch (error) {
      dispatch({
        type: todoActions.revertTodo,
        editedTodo: originalTodo,
        error: { message: `${error.message}. Reverting todo...` },
      });
    }
  };

  const onUnauthorized = useCallback(() => {
    dispatchUser({
      type: userActions.setAuthError,
      error: 'Your session has timed out.'
    });
    dispatchUser({ type: userActions.clearUser });
    navigate('/');
  }, [dispatchUser, navigate]);

  //Airtable-specific URL with params
  const encodeUrl = useCallback(() => {
    // const url = `https://api.airtable.com/v0/${import.meta.env.VITE_BASE_ID}/${import.meta.env.VITE_TABLE_NAME}`;
    const url = `${urlBase}/tasks`;
    let searchQuery = '';
    // let sortQuery = `sort[0][field]=${sortField}&sort[0][direction]=${sortDirection}`;
    let orderby = sortField;
    if (orderby == 'createdTime') orderby = 'creationDate';
    const sortQuery = `sortBy=${orderby}&sortDirection=${sortDirection}`;
    if (queryString) {
      // searchQuery = `&filterByFormula=SEARCH("${queryString}",+title)`;
      searchQuery = `&find=${queryString}`;
    }
    return encodeURI(`${url}?${sortQuery}${searchQuery}`);
  }, [queryString, sortField, sortDirection, urlBase]);

  useEffect(() => {
    const fetchTodos = async () => {
      dispatch({ type: todoActions.fetchTodos });
      const options = {
        method: 'GET',
        headers: {
          // Authorization: token,
        },
        credentials: 'include',
      };
      try {
        const resp = await fetch(encodeUrl(), options);
        if (resp.status === 401) {
          return onUnauthorized();
        }
        if (!resp.ok) {
          throw new Error(resp.message);
        }
        // const { records } = await resp.json();
        const taskArray = await resp.json();
        const records = taskArray.map((task) => {
          const record = { id: task.id, fields: task };
          // delete record.fields.id;
          return record;
        });
        dispatch({ type: todoActions.loadTodos, records });
      } catch (error) {
        dispatch({ type: todoActions.setLoadError, error });
      }
    };
    fetchTodos();
  }, [
    urlBase,
    queryString,
    sortDirection,
    sortField,
    encodeUrl,
    onUnauthorized
  ]);

  return (
    <>
      <p>{logonState.name} is logged on.</p>
      <button onClick={handleLogoff}>Logoff</button>
      {logoffError && <p>{logoffError}</p>}
      <hr />
      <TodoForm onAddTodo={addTodo} isSaving={todoState.isSaving} />

      <TodoList
        todoState={todoState}
        onCompleteTodo={completeTodo}
        onUpdateTodo={updateTodo}
      />
      <hr />
      <TodosViewForm
        queryString={queryString}
        setQueryString={setQueryString}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        sortField={sortField}
        setSortField={setSortField}
      />

      {todoState.errorMessage && (
        <div className={styles.errorWrapper}>
          <hr />
          <p>{todoState.errorMessage}</p>
          <button
            type="button"
            onClick={() => dispatch({ type: todoActions.clearError })}
          >
            Dismiss Error Message
          </button>
        </div>
      )}
    </>
  );
}
export default TodosPage;
