import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { announcementAPI } from '../services/api';
import { PageHeader, Button } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineSpeakerphone, HiOutlineTrash, HiOutlinePlus, HiOutlineX,
} from 'react-icons/hi';

/* ─── Create Form (FACULTY only) ─── */
const CreateForm = ({ onCreated, onCancel }) => {
  const { getToken } = useAuth();
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const res   = await announcementAPI.create(token, { title, content });
      toast.success('Announcement posted.');
      onCreated(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to post announcement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-5 border-l-4 border-maroon-600 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink-800">New Announcement</h3>
        <button onClick={onCancel} className="text-ink-400 hover:text-ink-700">
          <HiOutlineX className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Title</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Campus placement drive — Monday 10 AM"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
        </div>
        <div>
          <label className="label">Content</label>
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="Write your announcement here…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={saving}>Post Announcement</Button>
        </div>
      </form>
    </div>
  );
};

/* ─── Main Page ─── */
const AnnouncementsPage = () => {
  const { getToken, userProfile } = useAuth();
  const isFaculty = userProfile?.role === 'FACULTY';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res   = await announcementAPI.list(token);
        setAnnouncements(res.data || []);
      } catch (err) {
        toast.error(err.message || 'Failed to load announcements.');
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const handleCreated = (newAnn) => {
    setAnnouncements((prev) => [newAnn, ...prev]);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      const token = await getToken();
      await announcementAPI.remove(token, id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success('Announcement deleted.');
    } catch (err) {
      toast.error(err.message || 'Failed to delete.');
    }
  };

  const subtitle = isFaculty
    ? 'Post and manage announcements for your school'
    : 'Announcements relevant to your school';

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Announcements" subtitle={subtitle} />
        {isFaculty && !showForm && (
          <Button onClick={() => setShowForm(true)} className="flex-shrink-0">
            <HiOutlinePlus className="w-4 h-4 mr-1" /> New Announcement
          </Button>
        )}
      </div>

      {showForm && (
        <CreateForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineSpeakerphone className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className="card p-5 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink-800 leading-snug">{ann.title}</h3>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {ann.authorName}
                    {ann.schoolId && (
                      <span className="ml-2 bg-maroon-50 text-maroon-700 border border-maroon-200 px-1.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide">
                        {ann.schoolId}
                      </span>
                    )}
                    <span className="ml-2">
                      {ann.createdAt ? new Date(ann.createdAt).toLocaleString() : ''}
                    </span>
                  </p>
                </div>
                {isFaculty && ann.createdBy === userProfile?.uid && (
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="text-ink-300 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Delete announcement"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-ink-600 whitespace-pre-wrap">{ann.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
