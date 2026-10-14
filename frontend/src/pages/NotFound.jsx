import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="container py-5 text-center">
    <h1 className="display-4">404</h1>
    <p className="text-muted mb-4">Page not found.</p>
    <Link to="/" className="btn btn-crsp">Go Home</Link>
  </div>
);

export default NotFound;
