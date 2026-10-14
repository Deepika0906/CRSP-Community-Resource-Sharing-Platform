import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api
      .get('/notifications')
      .then((res) => setNotifications(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n._id}/read`);
      } catch (_) {}
    }
    if (n.link) navigate(n.link);
    else load();
  };

  const markAll = async () => {
    await api.put('/notifications/read-all');
    load();
  };

  if (loading) return <Loader />;

  return (
    <div className="container py-4" style={{ maxWidth: 700 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Notifications</h3>
        {notifications.some((n) => !n.isRead) && (
          <button className="btn btn-sm btn-outline-secondary" onClick={markAll}>
            Mark all as read
          </button>
        )}
      </div>
      <AlertMessage message={error} />
      {notifications.length === 0 ? (
        <EmptyState icon="bi-bell" title="No notifications yet" />
      ) : (
        <div className="list-group">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${!n.isRead ? 'bg-light' : ''}`}
            >
              <div>
                <div className={!n.isRead ? 'fw-semibold' : ''}>{n.message}</div>
                <div className="small text-muted">{timeAgo(n.createdAt)}</div>
              </div>
              {!n.isRead && <span className="notif-dot mt-1"></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
