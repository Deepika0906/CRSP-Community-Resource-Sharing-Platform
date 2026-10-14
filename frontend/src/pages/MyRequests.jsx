import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AlertMessage from '../components/AlertMessage';
import { getErrorMessage } from '../utils/getErrorMessage';

const ReviewForm = ({ transactionType, transactionId, onDone }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/reviews', { transactionType, transactionId, rating, comment });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-2 p-2 border rounded">
      {error && <div className="text-danger small mb-1">{error}</div>}
      <select className="form-select form-select-sm mb-1" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
        ))}
      </select>
      <textarea
        className="form-control form-control-sm mb-1"
        rows={2}
        placeholder="Leave a comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button className="btn btn-sm btn-crsp" disabled={submitting} onClick={submit}>
        Submit Review
      </button>
    </div>
  );
};

const MyRequests = () => {
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [giveawayRequests, setGiveawayRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState('');
  const [reviewingId, setReviewingId] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/borrow-requests', { params: { role: 'requester' } }),
      api.get('/giveaway-requests', { params: { role: 'requester' } }),
    ])
      .then(([b, g]) => {
        setBorrowRequests(b.data.data);
        setGiveawayRequests(g.data.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = async (type, id) => {
    setBusyId(id);
    setError('');
    setSuccess('');
    try {
      const path = type === 'borrow' ? `/borrow-requests/${id}/cancel` : `/giveaway-requests/${id}/cancel`;
      await api.put(path);
      setSuccess('Request cancelled.');
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
      <h3 className="mb-4">My Requests</h3>
      <AlertMessage message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <h5 className="mt-4">Borrow Requests I've Sent</h5>
      {borrowRequests.length === 0 ? (
        <EmptyState icon="bi-arrow-left-right" title="You haven't requested to borrow anything yet" />
      ) : (
        borrowRequests.map((r) => (
          <div key={r._id} className="card border-0 shadow-sm p-3 mb-2">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <Link to={`/resources/${r.resource?._id}`} className="fw-semibold">
                  {r.resource?.title}
                </Link>
                <div className="small text-muted">Owner: {r.owner?.name} &middot; Status: {r.status}</div>
              </div>
              <div className="d-flex gap-2">
                {['PENDING', 'ACCEPTED'].includes(r.status) && (
                  <button className="btn btn-sm btn-outline-danger" disabled={busyId === r._id} onClick={() => cancel('borrow', r._id)}>
                    Cancel
                  </button>
                )}
                {r.status === 'RETURNED' && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setReviewingId(reviewingId === r._id ? '' : r._id)}>
                    {reviewingId === r._id ? 'Close' : 'Leave Review'}
                  </button>
                )}
              </div>
            </div>
            {reviewingId === r._id && (
              <ReviewForm transactionType="BORROW" transactionId={r._id} onDone={() => { setReviewingId(''); setSuccess('Review submitted, thanks!'); }} />
            )}
          </div>
        ))
      )}

      <h5 className="mt-5">Giveaway Requests I've Sent</h5>
      {giveawayRequests.length === 0 ? (
        <EmptyState icon="bi-gift" title="You haven't requested any free items yet" />
      ) : (
        giveawayRequests.map((r) => (
          <div key={r._id} className="card border-0 shadow-sm p-3 mb-2">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <Link to={`/resources/${r.resource?._id}`} className="fw-semibold">
                  {r.resource?.title}
                </Link>
                <div className="small text-muted">Owner: {r.owner?.name} &middot; Status: {r.status}</div>
              </div>
              <div className="d-flex gap-2">
                {['PENDING', 'ACCEPTED'].includes(r.status) && (
                  <button className="btn btn-sm btn-outline-danger" disabled={busyId === r._id} onClick={() => cancel('giveaway', r._id)}>
                    Cancel
                  </button>
                )}
                {r.status === 'ACCEPTED' && !r.requesterConfirmedReceipt && (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={async () => {
                      try {
                        await api.put(`/giveaway-requests/${r._id}/confirm-receipt`);
                        setSuccess('Receipt confirmation recorded.');
                        load();
                      } catch (err) {
                        setError(getErrorMessage(err));
                      }
                    }}
                  >
                    Confirm I Received It
                  </button>
                )}
                {r.status === 'HANDED_OVER' && (
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setReviewingId(reviewingId === r._id ? '' : r._id)}>
                    {reviewingId === r._id ? 'Close' : 'Leave Review'}
                  </button>
                )}
              </div>
            </div>
            {reviewingId === r._id && (
              <ReviewForm transactionType="GIVEAWAY" transactionId={r._id} onDone={() => { setReviewingId(''); setSuccess('Review submitted, thanks!'); }} />
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MyRequests;
