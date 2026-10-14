import { useEffect, useState } from 'react';
import api from '../services/api';
import ResourceCard from '../components/ResourceCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/wishlist')
      .then((res) => setItems(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="container py-4">
      <h3 className="mb-4">My Wishlist</h3>
      <AlertMessage message={error} />
      {items.length === 0 ? (
        <EmptyState icon="bi-heart" title="Your wishlist is empty" subtitle="Tap the heart icon on any resource to save it here." />
      ) : (
        <div className="row">
          {items.map((item) => (
            <ResourceCard key={item._id} resource={item.resource} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
