function TodosViewForm({
  queryString,
  setQueryString,
  sortDirection,
  setSortDirection,
  sortField,
  setSortField,
}) {
  function preventRefresh(e) {
    e.preventDefault();
  }
  return (
    <form onSubmit={preventRefresh}>
      <div>
        <label>
          Search todos:
          <input
            type="text"
            id="search"
            value={queryString}
            onChange={(e) => setQueryString(e.target.value)}
          />
        </label>
        <button type="button" onClick={() => setQueryString('')}>
          Clear
        </button>
      </div>
      <div>
        <label>
          Sort by
          <select
            name="sortBy"
            id="sortBy"
            onChange={(e) => setSortField(e.target.value)}
            value={sortField}
          >
            <option value="title">Title</option>
            <option value="createdTime">Time Added</option>
          </select>
        </label>
        <label>
          Direction
          <select
            name="direction"
            id="direction"
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
      </div>
    </form>
  );
}

export default TodosViewForm;
