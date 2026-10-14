import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../services/api';

const statusLabel = (s) =>
  ({
    AVAILABLE: 'Available',
    RESERVED: 'Reserved',
    BORROWED: 'Borrowed',
    CLAIMED_PENDING_HANDOVER: 'Pending Handover',
    HANDED_OVER: 'Given Away',
    CANCELLED: 'Cancelled',
  }[s] || s);

const ResourceCard = ({ resource }) => {
  const img = resource.images && resource.images.length > 0 ? resolveImageUrl(resource.images[0]) : null;

  return (
    <div className="col-sm-6 col-lg-4 col-xl-3 mb-4">
      <Link to={`/resources/${resource._id}`} className="text-decoration-none text-dark">
        <div className="card resource-card">
          {img ? (
            <img src={img} className="card-img-top" alt={resource.title} />
          ) : (
            <div className="card-img-top d-flex align-items-center justify-content-center text-muted">
              <i className="bi bi-image fs-1"></i>
            </div>
          )}
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-1">
              <span className={`badge ${resource.sharingMode === 'GIVEAWAY' ? 'badge-free' : 'badge-lend'}`}>
                {resource.sharingMode === 'GIVEAWAY' ? 'FREE' : 'LEND'}
              </span>
              <span className={`status-pill status-${resource.status}`}>{statusLabel(resource.status)}</span>
            </div>
            <h6 className="card-title mb-1 text-truncate">{resource.title}</h6>
            <p className="card-text small text-muted mb-1 text-truncate">{resource.category} &middot; {resource.condition}</p>
            <p className="card-text small text-muted mb-0">
              <i className="bi bi-geo-alt me-1"></i>
              {resource.location}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ResourceCard;
