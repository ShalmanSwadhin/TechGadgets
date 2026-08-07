import { useEffect, useState } from 'react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/format';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const { showToast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    setSubscribersLoading(true);
    try {
      const { data } = await api.get('/admin/newsletter');
      setSubscribers(data.subscribers);
    } catch {
      setSubscribers([]);
    } finally {
      setSubscribersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSubscribers();
  }, []);

  const toggleBlock = async (id) => {
    try {
      await api.put(`/admin/users/${id}/toggle-block`);
      showToast('User status updated');
      fetchUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="text-slate-500">{users.length} registered users</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4 capitalize">{u.role}</td>
                <td className="p-4 text-slate-500">{formatDate(u.createdAt)}</td>
                <td className="p-4">
                  {u.isBlocked ? (
                    <span className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">Blocked</span>
                  ) : (
                    <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-600">Active</span>
                  )}
                </td>
                <td className="p-4">
                  {u.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => toggleBlock(u._id)}
                      className={`text-sm font-medium ${u.isBlocked ? 'text-emerald-600' : 'text-red-500'}`}
                    >
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-bold">Newsletter Subscribers</h2>
      <p className="text-slate-500">{subscribers.length} subscribed email(s)</p>
      {subscribersLoading ? (
        <div className="mt-6 flex justify-center"><Spinner /></div>
      ) : subscribers.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No newsletter signups yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="p-4">Email</th>
                <th className="p-4">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s._id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-4 font-medium">{s.email}</td>
                  <td className="p-4 text-slate-500">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
