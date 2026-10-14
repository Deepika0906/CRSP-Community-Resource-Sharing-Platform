import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AlertMessage from '../components/AlertMessage';
import { getErrorMessage } from '../utils/getErrorMessage';

const statusLabel = (s) =>
  ({
    AVAILABLE: 'Available',
    RESERVED: 'Reserved',
    BORROWED: 'Borrowed',
    CLAIMED_PENDING_HANDOVER: 'Pending Handover',
    HANDED_OVER: 'Given Away',
    CANCELLED: 'Cancelled',
  }[s] || s);

const AdminResources = () => {
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [q, setQ] = useState('');
  const [sharingMode, setSharingMode] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (q) params.q = q;
    if (sharingMode) params.sharingMode = sharingMode;
    api
      .get('/resources/admin/all', { params })
      .then((res) => {
        setResources(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page]);

  const search = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const remove = async (r) => {
    if (!window.confirm(`Remove listing "${r.title}"? This is typically used for fake, duplicate, or inappropriate listings.`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/resources/${r._id}`);
      setSuccess('Listing removed.');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading && resources.length === 0) return <Loader />;

  return (
    <div className="container py-4">
      <h3 className="mb-4">Resource Management</h3>
      <AlertMessage message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <form className="row g-2 mb-3" onSubmit={search}>
        <div className="col-md-5">
          <input className="form-control" placeholder="Search title or description..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={sharingMode} onChange={(e) => setSharingMode(e.target.value)}>
            <option value="">All modes</option>
            <option value="LEND">Lend / Borrow</option>
            <option value="GIVEAWAY">Giveaway</option>
          </select>
        </div>
        <div className="col-md-2 d-grid">
          <button className="btn btn-crsp">Search</button>
        </div>
      </form>

      {resources.length === 0 ? (
        <EmptyState icon="bi-box" title="No resources found" />
      ) : (
        <>
          <div className="table-responsive">
            <table className="table align-middle bg-white shadow-sm rounded">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <Link to={`/resources/${r._id}`}>{r.title}</Link>
                    </td>
                    <td className="small">
                      {r.owner?.name}
                      <div className="text-muted">{r.owner?.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${r.sharingMode === 'GIVEAWAY' ? 'badge-free' : 'badge-lend'}`}>
                        {r.sharingMode === 'GIVEAWAY' ? 'FREE' : 'LEND'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${r.status}`}>{statusLabel(r.status)}</span>
                    </td>
                    <td className="small text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(r)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <nav className="d-flex justify-content-center mt-3">
              <ul className="pagination">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <li key={p} className={`page-item ${p === pagination.page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p)}>
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default AdminResources;
