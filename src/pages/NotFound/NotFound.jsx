import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <>
      <p>Page not found</p>
      <Link to="/">Go back home</Link>
    </>
  );
}

export default NotFound;
