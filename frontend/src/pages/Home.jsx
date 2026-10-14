import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ResourceCard from '../components/ResourceCard';
import Loader from '../components/Loader';

const Home = () => {
  const [freeItems, setFreeItems] = useState([]);
  const [lendItems, setLendItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/resources', { params: { sharingMode: 'GIVEAWAY', availableOnly: 'true', limit: 4 } }),
      api.get('/resources', { params: { sharingMode: 'LEND', availableOnly: 'true', limit: 4 } }),
    ])
      .then(([freeRes, lendRes]) => {
        setFreeItems(freeRes.data.data);
        setLendItems(lendRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="container py-5">
        <div className="hero-section text-center">
          <h1 className="display-5 fw-bold mb-3">Borrow. Share. Build Community.</h1>
          <p className="lead mb-4">
            Lend what you're not using, borrow what you need, and give away items for free —
            all within your own community.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link to="/resources" className="btn btn-light btn-lg text-success fw-bold">
              Browse Resources
            </Link>
            <Link to="/resources?sharingMode=GIVEAWAY" className="btn btn-outline-light btn-lg">
              See Free Giveaways
            </Link>
          </div>
        </div>
      </div>

      <div className="container mb-5">
        <div className="row g-4 text-center">
          <div className="col-md-4">
            <i className="bi bi-arrow-left-right fs-1 text-success"></i>
            <h5 className="mt-2">Lend &amp; Borrow</h5>
            <p className="text-muted">Share items temporarily and get them back when you're done.</p>
          </div>
          <div className="col-md-4">
            <i className="bi bi-gift fs-1 text-success"></i>
            <h5 className="mt-2">Give Away Free</h5>
            <p className="text-muted">Pass unused items on to someone who needs them, permanently.</p>
          </div>
          <div className="col-md-4">
            <i className="bi bi-shield-check fs-1 text-success"></i>
            <h5 className="mt-2">Safe &amp; Simple</h5>
            <p className="text-muted">Requests, approvals, and history — all tracked for you.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">
              <i className="bi bi-gift text-warning me-2"></i>Free Giveaways
            </h4>
            <Link to="/resources?sharingMode=GIVEAWAY" className="small">
              View all &rarr;
            </Link>
          </div>
          <div className="row mb-5">
            {freeItems.length === 0 ? (
              <p className="text-muted">No free items available right now.</p>
            ) : (
              freeItems.map((r) => <ResourceCard key={r._id} resource={r} />)
            )}
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">
              <i className="bi bi-arrow-left-right text-primary me-2"></i>Available to Borrow
            </h4>
            <Link to="/resources?sharingMode=LEND" className="small">
              View all &rarr;
            </Link>
          </div>
          <div className="row mb-5">
            {lendItems.length === 0 ? (
              <p className="text-muted">No lending items available right now.</p>
            ) : (
              lendItems.map((r) => <ResourceCard key={r._id} resource={r} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
