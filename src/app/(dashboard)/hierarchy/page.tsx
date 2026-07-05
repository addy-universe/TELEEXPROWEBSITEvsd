'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  employeeId?: string | null;
  role: string;
  managerId: number | null;
  tlId: number | null;
  status: string;
}

export default function HierarchyPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hierarchy');
      const data = await res.json();
      setUsers(data.users || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: 'Director',
      MANAGER: 'Sales Manager',
      TL: 'Team Leader',
      AGENT: 'Sales Executive',
      HR: 'HR',
    };
    return map[role] || role;
  };

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: 'var(--accent-red)',
      HR: 'var(--accent-amber)',
      MANAGER: 'var(--accent-blue)',
      TL: 'var(--accent-green)',
      AGENT: 'var(--text-primary)',
    };
    return map[role] || 'var(--text-primary)';
  };

  // Build the hierarchy
  const directors = users.filter((u) => u.role === 'ADMIN');
  const hrs = users.filter((u) => u.role === 'HR');
  const managers = users.filter((u) => u.role === 'MANAGER');

  const getTeamLeaders = (managerId: number) =>
    users.filter((u) => u.role === 'TL' && u.managerId === managerId);

  const getAgentsForTL = (tlId: number) =>
    users.filter((u) => u.role === 'AGENT' && u.tlId === tlId);

  const getDirectAgentsForManager = (managerId: number) =>
    users.filter((u) => u.role === 'AGENT' && u.managerId === managerId && !u.tlId);

  const unassignedAgents = users.filter((u) => u.role === 'AGENT' && !u.managerId && !u.tlId);
  const unassignedTLs = users.filter((u) => u.role === 'TL' && !u.managerId);

  const EmployeeCard = ({ user }: { user: User }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'var(--bg-secondary)',
      border: `1px solid var(--border-color)`,
      borderLeft: `4px solid ${getRoleColor(user.role)}`,
      padding: '12px 16px',
      borderRadius: 'var(--radius-md)',
      minWidth: '240px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      opacity: user.status === 'INACTIVE' ? 0.6 : 1,
    }}>
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
          {user.fullName.charAt(0)}
        </div>
      )}
      <div>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{user.fullName}</h4>
        <p style={{ margin: 0, fontSize: '12px', color: getRoleColor(user.role), fontWeight: 600 }}>
          {getRoleLabel(user.role)}
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
          {user.employeeId || 'No Emp ID'}
          {user.status === 'INACTIVE' && ' (Inactive)'}
        </p>
      </div>
    </div>
  );

  if (loading) return <div className="loader" />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Organization Tree</h1>
          <p className="page-subtitle">Visual hierarchy of all employees</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ overflowX: 'auto', paddingBottom: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', minWidth: '800px' }}>
            
            {/* Top Level: Directors & HR */}
            <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
              {directors.map(dir => <EmployeeCard key={dir.id} user={dir} />)}
              {hrs.map(hr => <EmployeeCard key={hr.id} user={hr} />)}
            </div>

            {/* Connecting line from Top Level to Managers */}
            {(managers.length > 0) && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '2px', height: '32px', background: 'var(--border-color)' }} />
              </div>
            )}

            {/* Managers Level */}
            <div style={{ display: 'flex', gap: '48px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {managers.map(manager => {
                const tls = getTeamLeaders(manager.id);
                const directAgents = getDirectAgentsForManager(manager.id);
                
                return (
                  <div key={manager.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                    <EmployeeCard user={manager} />
                    
                    {(tls.length > 0 || directAgents.length > 0) && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
                        <div style={{ display: 'flex', gap: '32px', borderTop: '2px solid var(--border-color)', paddingTop: '24px', paddingLeft: '24px', paddingRight: '24px' }}>
                          
                          {/* Render TLs under this manager */}
                          {tls.map(tl => {
                            const agents = getAgentsForTL(tl.id);
                            return (
                              <div key={tl.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                                <EmployeeCard user={tl} />
                                
                                {agents.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '2px', height: '24px', background: 'var(--border-color)' }} />
                                    <div style={{ display: 'flex', gap: '16px', borderTop: '2px solid var(--border-color)', paddingTop: '24px' }}>
                                      {agents.map(agent => (
                                        <div key={agent.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                          <EmployeeCard user={agent} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Render Direct Agents under this manager */}
                          {directAgents.map(agent => (
                            <div key={agent.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <EmployeeCard user={agent} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Unassigned Section */}
            {(unassignedTLs.length > 0 || unassignedAgents.length > 0) && (
              <div style={{ marginTop: '48px', padding: '24px', borderTop: '2px dashed var(--border-color)' }}>
                <h3 style={{ color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center' }}>Unassigned Employees</h3>
                <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {unassignedTLs.map(tl => <EmployeeCard key={tl.id} user={tl} />)}
                  {unassignedAgents.map(agent => <EmployeeCard key={agent.id} user={agent} />)}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
