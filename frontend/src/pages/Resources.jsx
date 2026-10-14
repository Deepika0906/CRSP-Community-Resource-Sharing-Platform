import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ResourceCard from '../components/ResourceCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const CATEGORIES = ['Books', 'Electronics', 'Sports Equipment', 'Stationery', 'Clothing', 'Furniture', 'Others'];

const Resources = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    sharingMode: searchParams.get('sharingMode') || '',
    availableOnly: searchParams.get('availableOnly') || 'true',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  const fetchResources = useCallback(() => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    api
      .get('/resources', { params })
      .then((res) => {
        setResources(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchResources();
    const sp = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) sp[k] = v;
    });
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const clearFilters = () =>
    setFilters({ q: '', category: '', location: '', sharingMode: '', availableOnly: 'true', sort: 'newest', page: 1 });

  return (
    <div className="container py-4">
      <h3 className="mb-4">Browse Resources</h3>

      <div className="card border-0 shadow-sm p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small mb-1">Search</label>
            <input
              className="form-control"
              placeholder="Title or description..."
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Category</label>
            <select className="form-select" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Location</label>
            <input
              className="form-control"
              placeholder="City / area"
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Mode</label>
            <select className="form-select" value={filters.sharingMode} onChange={(e) => updateFilter('sharingMode', e.target.value)}>
              <option value="">All</option>
              <option value="LEND">Lend / Borrow</option>
              <option value="GIVEAWAY">Free Giveaway</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-1">Sort</label>
            <select className="form-select" value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="availability">Availability</option>
            </select>
          </div>
          <div className="col-md-1 d-grid">
            <button className="btn btn-outline-secondary" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </div>
        <div className="form-check mt-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="availableOnly"
            checked={filters.availableOnly === 'true'}
            onChange={(e) => updateFilter('availableOnly', e.target.checked ? 'true' : '')}
          />
          <label className="form-check-label small" htmlFor="availableOnly">
            Show only available items
          </label>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : resources.length === 0 ? (
        <EmptyState icon="bi-search" title="No resources found" subtitle="Try adjusting your filters." />
      ) : (
        <>
          <p className="text-muted small">{pagination.total} result(s)</p>
          <div className="row">
            {resources.map((r) => (
              <ResourceCard key={r._id} resource={r} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <nav className="d-flex justify-content-center mt-3">
              <ul className="pagination">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                  <li key={p} className={`page-item ${p === pagination.page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setFilters((f) => ({ ...f, page: p }))}>
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

export default Resources;
