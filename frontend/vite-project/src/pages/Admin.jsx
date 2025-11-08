import { useState } from 'react'
import './Admin.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL

const Admin = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [token, setToken] = useState(localStorage.getItem('adminToken') || '')
    const [adminData, setAdminData] = useState(null)
    const [teams, setTeams] = useState([])
    const [leaderboard, setLeaderboard] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const api = (path, opts = {}) => {
        const headers = opts.headers || {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        headers['Content-Type'] = headers['Content-Type'] || 'application/json'
        return fetch(`${API_BASE}/admin${path}`, { ...opts, headers })
            .then(async res => {
                const json = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(json.message || 'Request failed')
                return json
            })
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.message || 'Login failed')
            const t = json.data.token
            setToken(t)
            localStorage.setItem('adminToken', t)
            setAdminData(json.data.admin)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        setToken('')
        setAdminData(null)
        localStorage.removeItem('adminToken')
        setTeams([])
        setLeaderboard([])
        setStats(null)
    }

    const loadTeams = async () => {
        setLoading(true)
        setError('')
        try {
            const json = await api('/teams')
            setTeams(json.data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const loadLeaderboard = async () => {
        setLoading(true)
        setError('')
        try {
            const json = await api('/leaderboard')
            setLeaderboard(json.data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        setLoading(true)
        setError('')
        try {
            const json = await api('/stats')
            setStats(json.data || {})
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="admin-page">
            <h1>Admin Panel</h1>

            {!token ? (
                <form className="admin-login" onSubmit={handleLogin}>
                    <h2>Admin Login</h2>
                    {error && <div className="admin-error">{error}</div>}
                    <label>
                        Username
                        <input value={username} onChange={e => setUsername(e.target.value)} />
                    </label>
                    <label>
                        Password
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                    </label>
                    <div className="admin-actions">
                        <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
                    </div>
                </form>
            ) : (
                <div className="admin-tools">
                    <div className="admin-header">
                        <div>
                            <strong>{adminData?.name || adminData?.username || 'Admin'}</strong>
                            <div className="admin-role">{adminData?.role}</div>
                        </div>
                        <div>
                            <button onClick={handleLogout}>Logout</button>
                        </div>
                    </div>

                    <div className="admin-controls">
                        <button onClick={loadTeams}>Load Teams</button>
                        <button onClick={loadLeaderboard}>Load Leaderboard</button>
                        <button onClick={loadStats}>Load Stats</button>
                    </div>

                    {error && <div className="admin-error">{error}</div>}

                    {stats && (
                        <section className="admin-section">
                            <h3>Event Stats</h3>
                            <pre className="admin-pre">{JSON.stringify(stats, null, 2)}</pre>
                        </section>
                    )}

                    {leaderboard && leaderboard.length > 0 && (
                        <section className="admin-section">
                            <h3>Leaderboard</h3>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Team</th>
                                        <th>Sector</th>
                                        <th>Round1</th>
                                        <th>Round2</th>
                                        <th>Round3</th>
                                        <th>Total</th>
                                        <th>Verified</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map(row => (
                                        <tr key={row.teamName + row.rank}>
                                            <td>{row.rank}</td>
                                            <td>{row.teamName}</td>
                                            <td>{row.sector}</td>
                                            <td>{row.scores?.round1 ?? '-'}</td>
                                            <td>{row.scores?.round2 ?? '-'}</td>
                                            <td>{row.scores?.round3 ?? '-'}</td>
                                            <td>{row.scores?.total ?? '-'}</td>
                                            <td>{row.verified ? 'Yes' : 'No'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}

                    {teams && teams.length > 0 && (
                        <section className="admin-section">
                            <h3>Teams ({teams.length})</h3>
                            <div className="teams-list">
                                {teams.map(t => (
                                    <div className="team-card" key={t._id}>
                                        <div className="team-top">
                                            <div className="team-name">{t.teamName}</div>
                                            <div className="team-sector">{t.sector}</div>
                                        </div>
                                        <div className="team-body">
                                            <div>Round1: {t.round1?.finalScore ?? '-'}</div>
                                            <div>Round2: {t.round2?.finalScore ?? '-'}</div>
                                            <div>Round3: {t.round3?.finalScore ?? '-'}</div>
                                            <div>Total: {t.totalScore ?? '-'}</div>
                                            <div>Verified: {t.round3?.adminVerified ? 'Yes' : 'No'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}

export default Admin
