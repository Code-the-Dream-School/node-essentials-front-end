import {useCallback, useContext, useEffect, useReducer, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import AuthLogoff from '../../features/AuthLogoff/AuthLogoff';
import TodoForm from '../../features/TodoForm';
import TodoList from '../../features/TodoList/TodoList';
import TodoPaginationForm from '../../features/TodoPaginationForm';
import TodosViewForm from '../../features/TodosViewForm';
import {
  actions as userActions,
  context as UserContext
} from '../../reducers/user.reducer.js';
import {
  reducer as todosReducer,
  actions as todoActions,
  initialState as initialTodosState,
} from '../../reducers/todos.reducer';
import styles from '../../App.module.css';

const urlBase = import.meta.env.VITE_BASE_URL;

function TodosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sortDirection, setSortDirection] = useState('desc');
  const [sortField, setSortField] = useState('createdAt');
  const [queryString, setQueryString] = useState('');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [todoState, dispatch] = useReducer(todosReducer, initialTodosState);
  const {userState, dispatch: dispatchUser} = useContext(UserContext);

  const resetPage = () => {
    setPage(1);
    searchParams.delete('page');
    setSearchParams(searchParams);
  };

  const handleSortDirectionChange = useCallback((newSortDirection) => {
    setSortDirection(newSortDirection);
    resetPage();
  }, []); // eslint-disable-line

  const handleSortFieldChange = useCallback((newSortField) => {
    setSortField(newSortField);
    resetPage();
  }, []); // eslint-disable-line

  const handleQueryStringChange = useCallback((newQueryString) => {
    setQueryString(newQueryString);
    resetPage();
  }, []); // eslint-disable-line

  //pessimistic
  const addTodo = async (newTodo) => {
    const payload = {
      title: newTodo.title,
      isCompleted: newTodo.isCompleted,
    };
    const options = {
      method: 'POST',
      headers: {
        // Authorization: token,
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': userState?.userData?.csrfToken,
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
      setTotal(total + 1);
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
        title: editedTodo.title,
        createdTime: editedTodo.createdTime,
        isCompleted: editedTodo.isCompleted,
      };
      const options = {
        method: 'PATCH',
        headers: {
          // Authorization: token,
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': userState?.userData?.csrfToken,
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      };

      // const resp = await fetch(encodeUrl(), options);
      const resp = await fetch(`${urlBase}/api/tasks/${editedTodo.id}`, options);
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
  const deleteTodo = async (editedTodo) => {
    const originalTodoIndex = todoState.todoList.findIndex(
      (todo) => todo.id === editedTodo.id
    );
    const originalTodo = todoState.todoList[originalTodoIndex];
    dispatch({ type: todoActions.deleteTodo, id: editedTodo.id });
    try {
      const options = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': userState?.userData?.csrfToken,
        },
        credentials: 'include',
      };
      const resp = await fetch(`${urlBase}/api/tasks/${editedTodo.id}`, options);
      if (resp.status === 401) {
        return onUnauthorized();
      }
      if (!resp.ok) {
        throw new Error(resp.error);
      }
      setTotal(total - 1);
    } catch (error) {
      dispatch({
        type: todoActions.revertDeleteTodo,
        revertTodoIndex: originalTodoIndex,
        revertTodoItem: originalTodo,
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
        isCompleted: true,
      };
      const options = {
        method: 'PATCH',
        headers: {
          // Authorization: token,
          'Content-Type': 'application/json',
          'X-CSRF-Token': userState?.userData?.csrfToken,
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      };
      const resp = await fetch(`${urlBase}/api/tasks/${id}`, options);
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

  const encodeUrl = useCallback(() => {
    const url = `${urlBase}/api/tasks`;
    let searchQuery = '';
    const sortQuery = `sortBy=${sortField}&sortDirection=${sortDirection}`;
    if (queryString) {
      searchQuery = `&find=${queryString}`;
    }
    return encodeURI(`${url}?page=${page}&limit=${limit}&${sortQuery}${searchQuery}`);
  }, [page, limit, queryString, sortField, sortDirection]);

  useEffect(() => {
    const fetchTodos = async () => {
      dispatch({ type: todoActions.fetchTodos });
      const options = {
        method: 'GET',
        credentials: 'include',
      };
      try {
        const resp = await fetch(encodeUrl(), options);
        if (resp.status === 401) {
          return onUnauthorized();
        }
        if (resp.status === 404) {
          setTotal(0);
          return dispatch({type: todoActions.loadTodos, tasks: []});
        }
        if (!resp.ok) {
          throw new Error(resp.message);
        }
        const taskResp = await resp.json();
        dispatch({
          type: todoActions.loadTodos,
          tasks: taskResp.tasks
        });
        setTotal(taskResp.pagination.total);
      } catch (error) {
        dispatch({ type: todoActions.setLoadError, error });
      }
    };
    fetchTodos();
  }, [
    queryString,
    sortDirection,
    sortField,
    encodeUrl,
    onUnauthorized
  ]);

  return (
    <>
      <AuthLogoff />
      <hr />
      <TodoForm onAddTodo={addTodo} isSaving={todoState.isSaving} />

      <TodoList
        todoState={todoState}
        queryString={queryString}
        onCompleteTodo={completeTodo}
        onUpdateTodo={updateTodo}
        onDeleteTodo={deleteTodo}
      />
      <TodoPaginationForm
        isLoading={todoState.isLoading}
        page={page}
        setPage={setPage}
        total={total}
        limit={limit}
      />
      <hr />
      <TodosViewForm
        queryString={queryString}
        setQueryString={handleQueryStringChange}
        sortDirection={sortDirection}
        setSortDirection={handleSortDirectionChange}
        sortField={sortField}
        setSortField={handleSortFieldChange}
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
