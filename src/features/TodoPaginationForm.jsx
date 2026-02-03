import {useSearchParams} from 'react-router-dom';
import {styled} from 'styled-components';

function TodoPaginationForm({ isLoading, page, setPage, total, limit }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const totalPages = Math.ceil(total/limit);

  const handlePreviousPage = () => {
    const prevPage = Math.max(page - 1, 1);
    setPage(prevPage);
    if (prevPage === 1) {
      searchParams.delete('page');
      setSearchParams(searchParams);
    } else {
      setSearchParams({page: prevPage});
    }
  };

  const handleNextPage = () => {
    const nextPage = Math.min(page + 1, totalPages);
    setPage(nextPage);
    setSearchParams({ page: nextPage });
  };

  return (
    <>
      <StyledDiv>
        <button
          type="button"
          onClick={handlePreviousPage}
          disabled={page === 1 || isLoading}
        >
          Previous
        </button>
        {!isLoading ?
          <span>
            Page {page} of {totalPages}
          </span> : <></>
        }
        <button
          type="button"
          onClick={handleNextPage}
          disabled={page >= totalPages || isLoading}
        >
          Next
        </button>
      </StyledDiv>
    </>
  );
}

const StyledDiv = styled.div`
    display: flex;
    gap: 1rem;
`;

export default TodoPaginationForm;
