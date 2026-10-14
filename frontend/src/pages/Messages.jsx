import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { resolveImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';

const Messages = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeThread, setActiveThread] = useState(null); // { resource, otherUser }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadThreads = () => {
    setLoading(true);
    api
      .get('/messages')
      .then((res) => {
        setThreads(res.data.data);
        const rId = searchParams.get('resource');
        const uId = searchParams.get('user');
        if (rId && uId) {
          const match = res.data.data.find((t) => t.resource?._id === rId && t.otherUser?._id === uId);
          if (match) setActiveThread(match);
          else setActiveThread({ resource: { _id: rId }, otherUser: { _id: uId, name: 'User' } });
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadThreads, []);

  const loadMessages = useCallback(() => {
    if (!activeThread) return;
    api
      .get(`/messages/${activeThread.resource._id}/${activeThread.otherUser._id}`)
      .then((res) => setMessages(res.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [activeThread]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openThread = (t) => {
    setActiveThread(t);
    setSearchParams({ resource: t.resource._id, user: t.otherUser._id });
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeThread) return;
    setSending(true);
    try {
      await api.post('/messages', {
        resourceId: activeThread.resource._id,
        recipientId: activeThread.otherUser._id,
        text,
      });
      setText('');
      loadMessages();
      loadThreads();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container py-4">
      <h3 className="mb-4">Messages</h3>
      <AlertMessage message={error} onClose={() => setError('')} />

      <div className="row g-3" style={{ minHeight: 500 }}>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            {threads.length === 0 ? (
              <EmptyState icon="bi-chat" title="No conversations yet" subtitle="Message an owner from a resource's request." />
            ) : (
              <div className="list-group list-group-flush">
                {threads.map((t) => (
                  <button
                    key={`${t.resource?._id}-${t.otherUser?._id}`}
                    className={`list-group-item list-group-item-action ${
                      activeThread && activeThread.resource._id === t.resource?._id && activeThread.otherUser._id === t.otherUser?._id
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => openThread(t)}
                  >
                    <div className="fw-semibold">{t.otherUser?.name}</div>
                    <div className="small text-truncate">{t.resource?.title}</div>
                    <div className="small text-muted text-truncate">{t.lastMessage}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-md-8">
          <div className="card border-0 shadow-sm h-100 d-flex flex-column">
            {!activeThread ? (
              <EmptyState icon="bi-chat-dots" title="Select a conversation" />
            ) : (
              <>
                <div className="p-3 border-bottom fw-semibold">
                  {activeThread.otherUser?.name} &middot; <span className="small text-muted">{activeThread.resource?.title}</span>
                </div>
                <div className="p-3 flex-grow-1" style={{ overflowY: 'auto', maxHeight: 380 }}>
                  {messages.map((m) => (
                    <div
                      key={m._id}
                      className={`d-flex mb-2 ${String(m.sender._id) === String(user._id) ? 'justify-content-end' : ''}`}
                    >
                      <div
                        className={`p-2 rounded ${
                          String(m.sender._id) === String(user._id) ? 'bg-success text-white' : 'bg-light'
                        }`}
                        style={{ maxWidth: '70%' }}
                      >
                        <div className="small">{m.text}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <form className="p-2 border-top d-flex gap-2" onSubmit={send}>
                  <input
                    className="form-control"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <button className="btn btn-crsp" disabled={sending}>
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
