import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { resolveImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';
import Loader from '../components/Loader';
import AlertMessage from '../components/AlertMessage';

const statusLabel = (s) =>
  ({
    AVAILABLE: 'Available',
    RESERVED: 'Reserved',
    BORROWED: 'Borrowed',
    CLAIMED_PENDING_HANDOVER: 'Pending Handover',
    HANDED_OVER: 'Given Away (Completed)',
    CANCELLED: 'Cancelled',
  }[s] || s);

const ResourceDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('FAKE_LISTING');
  const [reportDetails, setReportDetails] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get(`/resources/${id}`)
      .then((res) => setResource(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    setActiveImg(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!user) return;
    api
      .get('/wishlist')
      .then((res) => setInWishlist(res.data.data.some((w) => w.resource._id === id)))
      .catch(() => {});
  }, [user, id]);

  const isOwner = user && resource && String(resource.owner?._id) === String(user._id);

  const handleRequest = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      if (resource.sharingMode === 'LEND') {
        await api.post('/borrow-requests', { resourceId: id, message });
      } else {
        await api.post('/giveaway-requests', { resourceId: id, message });
      }
      setSuccess('Your request has been sent to the owner.');
      setMessage('');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWishlist = async () => {
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${id}`);
        setInWishlist(false);
      } else {
        await api.post('/wishlist', { resourceId: id });
        setInWishlist(true);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reports', { resourceId: id, reason: reportReason, details: reportDetails });
      setSuccess('Thanks — your report has been submitted for review.');
      setShowReport(false);
      setReportDetails('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return;
    try {
      await api.delete(`/resources/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <Loader />;
  if (!resource) return <div className="container py-5"><AlertMessage message={error || 'Resource not found'} /></div>;

  const images = resource.images || [];

  return (
    <div className="container py-4">
      <AlertMessage message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm mb-2">
            {images.length > 0 ? (
              <img
                src={resolveImageUrl(images[activeImg])}
                alt={resource.title}
                style={{ width: '100%', height: 360, objectFit: 'cover', borderRadius: 8 }}
              />
            ) : (
              <div
                style={{ width: '100%', height: 360, borderRadius: 8 }}
                className="bg-light d-flex align-items-center justify-content-center text-muted"
              >
                <i className="bi bi-image fs-1"></i>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="d-flex gap-2">
              {images.map((img, i) => (
                <img
                  key={img}
                  src={resolveImageUrl(img)}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: 'cover',
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: i === activeImg ? '2px solid var(--crsp-green)' : '1px solid #ddd',
                  }}
                  alt=""
                />
              ))}
            </div>
          )}
        </div>

        <div className="col-md-6">
          <div className="d-flex gap-2 mb-2">
            <span className={`badge ${resource.sharingMode === 'GIVEAWAY' ? 'badge-free' : 'badge-lend'}`}>
              {resource.sharingMode === 'GIVEAWAY' ? 'FREE / GIVEAWAY' : 'LEND / BORROW'}
            </span>
            <span className={`status-pill status-${resource.status}`}>{statusLabel(resource.status)}</span>
          </div>
          <h3>{resource.title}</h3>
          <p className="text-muted mb-2">
            {resource.category} &middot; Condition: {resource.condition}
          </p>
          <p className="mb-3">
            <i className="bi bi-geo-alt me-1"></i>
            {resource.location}
          </p>
          <p>{resource.description}</p>

          {resource.sharingMode === 'GIVEAWAY' && (
            <div className="alert alert-warning small">
              <i className="bi bi-info-circle me-1"></i>
              This item will be given away permanently. Ownership transfers to the accepted requester once
              handover is confirmed.
            </div>
          )}

          <div className="card border-0 bg-light p-3 mb-3">
            <p className="mb-1 fw-bold">Owner</p>
            <p className="mb-2">{resource.owner?.name}</p>
            {user && !isOwner && (
              <Link
                to={`/messages?resource=${resource._id}&user=${resource.owner?._id}`}
                className="btn btn-sm btn-outline-secondary"
              >
                <i className="bi bi-chat-dots me-1"></i>Message Owner
              </Link>
            )}
          </div>

          {!user && (
            <Link to="/login" className="btn btn-crsp">
              Log in to request this item
            </Link>
          )}

          {user && isOwner && (
            <div className="d-flex gap-2 flex-wrap">
              {resource.status === 'AVAILABLE' && (
                <Link to={`/resources/${id}/edit`} className="btn btn-outline-secondary">
                  Edit
                </Link>
              )}
              {resource.status === 'AVAILABLE' && (
                <button className="btn btn-outline-danger" onClick={handleDelete}>
                  Delete
                </button>
              )}
              <Link to="/dashboard" className="btn btn-crsp">
                Manage Requests
              </Link>
            </div>
          )}

          {user && !isOwner && resource.status === 'AVAILABLE' && (
            <div className="card border-0 shadow-sm p-3">
              <label className="form-label small">Optional message to the owner</label>
              <textarea
                className="form-control mb-2"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={resource.sharingMode === 'GIVEAWAY' ? 'Why would this item help you?' : 'When would you like to borrow it?'}
              />
              <div className="d-flex gap-2">
                <button className="btn btn-crsp" disabled={submitting} onClick={handleRequest}>
                  {resource.sharingMode === 'GIVEAWAY' ? 'Claim This Item' : 'Request to Borrow'}
                </button>
                <button className="btn btn-outline-secondary" onClick={toggleWishlist}>
                  <i className={`bi ${inWishlist ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                </button>
              </div>
            </div>
          )}

          {user && !isOwner && resource.status !== 'AVAILABLE' && (
            <div className="alert alert-secondary">This item is currently not available for new requests.</div>
          )}

          {user && !isOwner && (
            <button className="btn btn-link text-muted small mt-2 p-0" onClick={() => setShowReport(!showReport)}>
              <i className="bi bi-flag me-1"></i>Report this listing
            </button>
          )}

          {showReport && (
            <form className="card border-0 shadow-sm p-3 mt-2" onSubmit={handleReport}>
              <label className="form-label small">Reason</label>
              <select className="form-select mb-2" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
                <option value="FAKE_LISTING">Fake listing</option>
                <option value="DAMAGED_RESOURCE">Damaged resource</option>
                <option value="INAPPROPRIATE_CONTENT">Inappropriate content</option>
                <option value="OTHER">Other</option>
              </select>
              <textarea
                className="form-control mb-2"
                rows={2}
                placeholder="Additional details (optional)"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
              <button className="btn btn-sm btn-outline-danger">Submit Report</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceDetail;
