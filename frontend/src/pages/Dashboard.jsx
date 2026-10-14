import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { resolveImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';

const statusLabel = (s) =>
  ({
    AVAILABLE: 'Available',
    RESERVED: 'Reserved',
    BORROWED: 'Borrowed',
    CLAIMED_PENDING_HANDOVER: 'Pending Handover',
    HANDED_OVER: 'Given Away',
    CANCELLED: 'Cancelled',
  }[s] || s);

const MiniResourceRow = ({ r }) => (
  <Link to={`/resources/${r._id}`} className="d-flex align-items-center gap-3 py-2 border-bottom text-dark">
    <img
      src={r.images && r.images[0] ? resolveImageUrl(r.images[0]) : 'https://via.placeholder.com/48?text=%20'}
      alt=""
      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
    />
    <div className="flex-grow-1">
      <div className="fw-semibold">{r.title}</div>
      <div className="small text-muted">{r.category}</div>
    </div>
    <span className={`status-pill status-${r.status}`}>{statusLabel(r.status)}</span>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className="container py-5"><AlertMessage message={error} /></div>;

  const {
    stats,
    myResources,
    activeBorrowings,
    myGiveawayListings,
    givenAway,
    received,
    pendingBorrowRequestsSent,
    pendingGiveawayRequestsSent,
    recentNotifications,
  } = data;

  return (
    <div className="container py-4">
      {/* Profile summary */}
      <div className="card border-0 shadow-sm p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <img
              src={user.avatar ? resolveImageUrl(user.avatar) : 'https://via.placeholder.com/64?text=%20'}
              alt=""
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <h4 className="mb-0">Welcome back, {user.name?.split(' ')[0]}</h4>
              <div className="small text-muted">
                {user.email} &middot; {user.phone} &middot; {user.address}
              </div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Link to="/profile" className="btn btn-outline-secondary btn-sm">
              Edit Profile
            </Link>
            <Link to="/add-resource" className="btn btn-crsp btn-sm">
              <i className="bi bi-plus-lg me-1"></i>Share a Resource
            </Link>
          </div>
        </div>
      </div>

      {/* Quick-access cards to the full request pages, with live counts */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <Link to="/dashboard/incoming-requests" className="card border-0 shadow-sm p-3 text-center text-decoration-none text-dark h-100">
            <div className="fs-3 fw-bold text-danger">{stats.totalIncoming}</div>
            <div className="small text-muted">Incoming Requests</div>
          </Link>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/dashboard/my-requests" className="card border-0 shadow-sm p-3 text-center text-decoration-none text-dark h-100">
            <div className="fs-3 fw-bold text-primary">{stats.totalPendingSent}</div>
            <div className="small text-muted">My Pending Requests</div>
          </Link>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/wishlist" className="card border-0 shadow-sm p-3 text-center text-decoration-none text-dark h-100">
            <div className="fs-3 fw-bold text-warning">{stats.wishlistCount}</div>
            <div className="small text-muted">Wishlist Items</div>
          </Link>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/notifications" className="card border-0 shadow-sm p-3 text-center text-decoration-none text-dark h-100">
            <div className="fs-3 fw-bold text-info">{stats.unreadNotifications}</div>
            <div className="small text-muted">Unread Notifications</div>
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center">
            <div className="fs-3 fw-bold text-success">{stats.totalMyResources}</div>
            <div className="small text-muted">My Resources</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center">
            <div className="fs-3 fw-bold text-primary">{stats.totalActiveBorrowings}</div>
            <div className="small text-muted">Active Borrowings</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center">
            <div className="fs-3 fw-bold text-warning">{stats.totalGivenAway}</div>
            <div className="small text-muted">Given Away</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm p-3 text-center">
            <div className="fs-3 fw-bold text-info">{stats.totalReceived}</div>
            <div className="small text-muted">Received</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">My Resources</h6>
              <Link to="/add-resource" className="small">+ Add new</Link>
            </div>
            {myResources.length === 0 ? (
              <EmptyState icon="bi-box" title="No resources yet" subtitle="Share your first item with the community." />
            ) : (
              myResources.map((r) => <MiniResourceRow key={r._id} r={r} />)
            )}
          </div>

          <div className="card border-0 shadow-sm p-3 mb-4">
            <h6 className="mb-2">My Active Borrowings</h6>
            {activeBorrowings.length === 0 ? (
              <EmptyState icon="bi-arrow-left-right" title="Nothing borrowed right now" />
            ) : (
              activeBorrowings.map((b) => <MiniResourceRow key={b._id} r={b.resource} />)
            )}
          </div>

          <div className="card border-0 shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Pending Requests I've Sent</h6>
              <Link to="/dashboard/my-requests" className="small">View all &rarr;</Link>
            </div>
            {pendingBorrowRequestsSent.length === 0 && pendingGiveawayRequestsSent.length === 0 ? (
              <EmptyState icon="bi-hourglass-split" title="No pending requests" />
            ) : (
              <>
                {pendingBorrowRequestsSent.map((r) => <MiniResourceRow key={r._id} r={r.resource} />)}
                {pendingGiveawayRequestsSent.map((r) => <MiniResourceRow key={r._id} r={r.resource} />)}
              </>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-3 mb-4">
            <h6 className="mb-2">My Free Giveaway Listings</h6>
            {myGiveawayListings.length === 0 ? (
              <EmptyState icon="bi-gift" title="No giveaway listings" />
            ) : (
              myGiveawayListings.map((r) => <MiniResourceRow key={r._id} r={r} />)
            )}
          </div>

          <div className="card border-0 shadow-sm p-3 mb-4">
            <h6 className="mb-2">Given Away (Completed)</h6>
            {givenAway.length === 0 ? (
              <EmptyState icon="bi-check-circle" title="No completed giveaways yet" />
            ) : (
              givenAway.map((g) => <MiniResourceRow key={g._id} r={g.resource} />)
            )}
          </div>

          <div className="card border-0 shadow-sm p-3 mb-4">
            <h6 className="mb-2">Received (Completed)</h6>
            {received.length === 0 ? (
              <EmptyState icon="bi-inbox" title="Nothing received yet" />
            ) : (
              received.map((g) => <MiniResourceRow key={g._id} r={g.resource} />)
            )}
          </div>

          <div className="card border-0 shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Recent Notifications</h6>
              <Link to="/notifications" className="small">View all &rarr;</Link>
            </div>
            {recentNotifications.length === 0 ? (
              <EmptyState icon="bi-bell" title="No notifications yet" />
            ) : (
              recentNotifications.map((n) => (
                <div key={n._id} className={`py-2 border-bottom small ${!n.isRead ? 'fw-semibold' : 'text-muted'}`}>
                  {n.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
