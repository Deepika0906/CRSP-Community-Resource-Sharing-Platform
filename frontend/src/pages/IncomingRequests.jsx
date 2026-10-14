import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AlertMessage from '../components/AlertMessage';
import { getErrorMessage } from '../utils/getErrorMessage';

const IncomingRequests = () => {
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [giveawayRequests, setGiveawayRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/borrow-requests', { params: { role: 'owner' } }),
      api.get('/giveaway-requests', { params: { role: 'owner' } }),
    ])
      .then(([b, g]) => {
        setBorrowRequests(b.data.data);
        setGiveawayRequests(g.data.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (fn, id) => {
    setError('');
    setSuccess('');
    setBusyId(id);
    try {
      await fn();
      setSuccess('Done.');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container py-4">
      <h3 className="mb-4">Incoming Requests</h3>
      <AlertMessage message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <h5 className="mt-4">Borrow Requests</h5>
      {borrowRequests.length === 0 ? (
        <EmptyState icon="bi-arrow-left-right" title="No borrow requests" />
      ) : (
        <div className="table-responsive mb-5">
          <table className="table align-middle bg-white shadow-sm rounded">
            <thead>
              <tr>
                <th>Item</th>
                <th>Requester</th>
                <th>Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {borrowRequests.map((r) => (
                <tr key={r._id}>
                  <td>
                    <Link to={`/resources/${r.resource?._id}`}>{r.resource?.title}</Link>
                  </td>
                  <td>{r.requester?.name}</td>
                  <td className="small text-muted">{r.message || '—'}</td>
                  <td><span className={`status-pill status-${r.status === 'PENDING' ? 'RESERVED' : r.status === 'ACCEPTED' ? 'RESERVED' : r.status === 'COLLECTED' ? 'BORROWED' : r.status === 'RETURNED' ? 'AVAILABLE' : 'CANCELLED'}`}>{r.status}</span></td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            disabled={busyId === r._id}
                            className="btn btn-sm btn-crsp"
                            onClick={() => act(() => api.put(`/borrow-requests/${r._id}/accept`), r._id)}
                          >
                            Accept
                          </button>
                          <button
                            disabled={busyId === r._id}
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => act(() => api.put(`/borrow-requests/${r._id}/reject`), r._id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'ACCEPTED' && (
                        <button
                          disabled={busyId === r._id}
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => act(() => api.put(`/borrow-requests/${r._id}/collect`), r._id)}
                        >
                          Mark Collected
                        </button>
                      )}
                      {r.status === 'COLLECTED' && (
                        <button
                          disabled={busyId === r._id}
                          className="btn btn-sm btn-outline-success"
                          onClick={() => act(() => api.put(`/borrow-requests/${r._id}/return`), r._id)}
                        >
                          Confirm Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h5>Giveaway Requests</h5>
      {giveawayRequests.length === 0 ? (
        <EmptyState icon="bi-gift" title="No giveaway requests" />
      ) : (
        <div className="table-responsive">
          <table className="table align-middle bg-white shadow-sm rounded">
            <thead>
              <tr>
                <th>Item</th>
                <th>Requester</th>
                <th>Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {giveawayRequests.map((r) => (
                <tr key={r._id}>
                  <td>
                    <Link to={`/resources/${r.resource?._id}`}>{r.resource?.title}</Link>
                  </td>
                  <td>{r.requester?.name}</td>
                  <td className="small text-muted">{r.message || '—'}</td>
                  <td>{r.status}</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            disabled={busyId === r._id}
                            className="btn btn-sm btn-crsp"
                            onClick={() => act(() => api.put(`/giveaway-requests/${r._id}/accept`), r._id)}
                          >
                            Accept
                          </button>
                          <button
                            disabled={busyId === r._id}
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => act(() => api.put(`/giveaway-requests/${r._id}/reject`), r._id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'ACCEPTED' && (
                        <button
                          disabled={busyId === r._id}
                          className="btn btn-sm btn-outline-success"
                          onClick={() => act(() => api.put(`/giveaway-requests/${r._id}/confirm-handover`), r._id)}
                        >
                          Confirm Handover (Final)
                        </button>
                      )}
                      {r.status === 'HANDED_OVER' && <span className="text-success small">Completed</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IncomingRequests;
