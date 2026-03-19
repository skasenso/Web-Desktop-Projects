'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, Mail, Shield, UserPlus, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { inviteWorker, getFarmMembers } from '@/lib/actions/staff-actions';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    setIsLoading(true);
    try {
      const data = await getFarmMembers();
      if (data) {
        setMembers(data.members || []);
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsInviting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const role = formData.get('role') as any;

    try {
      const result = await inviteWorker({ email, role });
      if (result.success) {
        setMessage({ type: 'success', text: `Invitation sent to ${email}!` });
        e.currentTarget.reset();
        loadTeam();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send invitation.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsInviting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: any = {
      OWNER: 'bg-purple-100 text-purple-800',
      MANAGER: 'bg-blue-100 text-blue-800',
      WORKER: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Team Management</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-700" /> Active Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-700" /></div>
              ) : members.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No staff members found.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <div key={member.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center text-white font-bold">
                          {member.user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{member.user.name}</p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                        </div>
                      </div>
                      {getRoleBadge(member.role)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-amber-600" /> Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-700" /></div>
              ) : invitations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending invitations.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {invitations.map((invite) => (
                    <div key={invite.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{invite.email}</p>
                          <p className="text-sm text-gray-500">Sent on {new Date(invite.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getRoleBadge(invite.role)}
                        <span className="text-xs text-amber-600 font-medium">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-green-100 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-green-700" /> Invite Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                {message && (
                  <div className={`p-3 rounded-md text-sm flex items-center ${
                    message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                    {message.text}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    name="email"
                    type="email" 
                    required
                    placeholder="staff@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
                  <select 
                    name="role"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="WORKER">Worker</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={isInviting}
                  className="w-full bg-green-800 text-white py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Invitation
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center">
                <Shield className="w-4 h-4 mr-2 text-blue-600" /> Role Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-bold text-gray-700">Manager</p>
                  <p className="text-gray-500">Full visibility of all farm operations and logs. Can manage staff and inventory.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-700">Worker</p>
                  <p className="text-gray-500">Limited to data entry (logs). Can only view their own activity records.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
