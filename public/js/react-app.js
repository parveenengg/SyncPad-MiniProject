// ========================================
// REACT NATIVE WEB - SYNC PAD
// ========================================
// Simple React components for gradual migration

const { useState, useEffect } = React;

// ========================================
// API SERVICE
// ========================================
class ApiService {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('syncpad_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('syncpad_token', token);
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth methods
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(data.token);
        return data;
    }

    async register(email, password, name) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
        this.setToken(data.token);
        return data;
    }

    // Notes methods
    async getNotes() {
        return this.request('/notes');
    }

    async createNote(noteData) {
        return this.request('/notes', {
            method: 'POST',
            body: JSON.stringify(noteData),
        });
    }

    async updateNote(id, noteData) {
        return this.request(`/notes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(noteData),
        });
    }

    async deleteNote(id) {
        return this.request(`/notes/${id}`, {
            method: 'DELETE',
        });
    }
}

const api = new ApiService();

// ========================================
// REACT COMPONENTS
// ========================================

// Registration Component
const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await api.register(email, password, name);
            onRegister(result.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                Register (React)
            </h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-md bg-gray-100 border border-gray-300 focus:border-blue-500 focus:outline-none"
                        placeholder="Full Name"
                        required
                    />
                </div>
                
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-md bg-gray-100 border border-gray-300 focus:border-blue-500 focus:outline-none"
                        placeholder="Email"
                        required
                    />
                </div>
                
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-md bg-gray-100 border border-gray-300 focus:border-blue-500 focus:outline-none"
                        placeholder="Password"
                        required
                        minLength="6"
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
                
                <div className="text-center">
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                    >
                        Already have an account? Login
                    </button>
                </div>
            </form>
        </div>
    );
};

// Login Component
const LoginForm = ({ onLogin, onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await api.login(email, password);
            onLogin(result.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                Login (React)
            </h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-md bg-gray-100 border border-gray-300 focus:border-blue-500 focus:outline-none"
                        placeholder="Email"
                        required
                    />
                </div>
                
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-md bg-gray-100 border border-gray-300 focus:border-blue-500 focus:outline-none"
                        placeholder="Password"
                        required
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                
                <div className="text-center">
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="text-green-500 hover:text-green-600 text-sm"
                    >
                        Don't have an account? Register
                    </button>
                </div>
            </form>
        </div>
    );
};

// Create Note Component
const CreateNote = ({ onBack, onNoteCreated }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const noteData = {
                title: title || 'Untitled Note',
                content: content || '',
                encrypted: false,
                shareable: false
            };
            
            const result = await api.createNote(noteData);
            onNoteCreated(result.data);
            onBack();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 md:px-10 content-with-footer">
            <div className="mb-8 mt-6 md:mt-10">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Create New Note
                    </h1>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="mb-6">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                            placeholder="Note title..."
                        />
                    </div>
                    
                    <div className="mb-6">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none resize-none"
                            rows="15"
                            placeholder="Start writing your note..."
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Note'}
                        </button>
                        
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

// Edit Note Component
const EditNote = ({ note, onBack, onNoteUpdated }) => {
    const [title, setTitle] = useState(note.title || '');
    const [content, setContent] = useState(note.content || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const noteData = {
                title: title || 'Untitled Note',
                content: content || ''
            };
            
            const result = await api.updateNote(note._id, noteData);
            onNoteUpdated(result.data);
            onBack();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 md:px-10 content-with-footer">
            <div className="mb-8 mt-6 md:mt-10">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Edit Note
                    </h1>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="mb-6">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                            placeholder="Note title..."
                        />
                    </div>
                    
                    <div className="mb-6">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none resize-none"
                            rows="15"
                            placeholder="Start writing your note..."
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update Note'}
                        </button>
                        
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

// View Note Component
const ViewNote = ({ note, onBack, onEdit, onDelete }) => {
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this note?')) {
            onDelete(note._id);
        }
    };

    return (
        <div className="px-4 md:px-10 content-with-footer">
            <div className="mb-8 mt-6 md:mt-10">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        View Note
                    </h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            {note.title}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Created: {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    
                    <div className="mb-6">
                        <div className="prose max-w-none">
                            <p className="text-gray-700 whitespace-pre-wrap">
                                {note.content}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={() => onEdit(note)}
                            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Edit Note
                        </button>
                        
                        <button
                            onClick={handleDelete}
                            className="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        >
                            Delete Note
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Notes List Component
const NotesList = ({ user, onLogout, onCreateNote, onViewNote, onEditNote }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const result = await api.getNotes();
            setNotes(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this note?')) {
            try {
                await api.deleteNote(id);
                setNotes(notes.filter(note => note._id !== id));
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading notes...</div>;
    }

    return (
        <div className="px-4 md:px-10 content-with-footer">
            <div className="mb-8 mt-6 md:mt-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                            Welcome, {user.name}! (React)
                        </h1>
                        <p className="text-gray-600">Your notes from React Native Web</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
                
                <button
                    onClick={onCreateNote}
                    className="mb-6 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                    + Create New Note
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {notes.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg mb-4">No notes yet!</p>
                    <button
                        onClick={onCreateNote}
                        className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        Create Your First Note
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map(note => (
                        <div key={note._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">
                                {note.title}
                            </h3>
                            <p className="text-gray-600 mb-4 text-sm">
                                {note.content ? note.content.substring(0, 100) + '...' : 'No content'}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onViewNote(note)}
                                    className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-md text-center hover:bg-blue-600"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => onEditNote(note)}
                                    className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded-md text-center hover:bg-yellow-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(note._id)}
                                    className="flex-1 bg-red-500 text-white px-3 py-2 rounded-md text-center hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Main App Component
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState('notes'); // 'notes', 'create', 'edit', 'view'
    const [authView, setAuthView] = useState('login'); // 'login', 'register'
    const [selectedNote, setSelectedNote] = useState(null);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('syncpad_token');
        if (token) {
            // In a real app, you'd verify the token
            setUser({ name: 'API User', email: 'api@example.com' });
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        setCurrentView('notes');
    };

    const handleRegister = (userData) => {
        setUser(userData);
        setCurrentView('notes');
    };

    const handleLogout = () => {
        localStorage.removeItem('syncpad_token');
        setUser(null);
        setCurrentView('notes');
        setSelectedNote(null);
    };

    const handleCreateNote = () => {
        setCurrentView('create');
    };

    const handleViewNote = (note) => {
        setSelectedNote(note);
        setCurrentView('view');
    };

    const handleEditNote = (note) => {
        setSelectedNote(note);
        setCurrentView('edit');
    };

    const handleNoteCreated = (note) => {
        // Refresh notes list
        setCurrentView('notes');
    };

    const handleNoteUpdated = (note) => {
        // Refresh notes list
        setCurrentView('notes');
    };

    const handleBackToNotes = () => {
        setCurrentView('notes');
        setSelectedNote(null);
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-120px)] content-with-footer">
                {authView === 'login' ? (
                    <LoginForm 
                        onLogin={handleLogin} 
                        onSwitchToRegister={() => setAuthView('register')}
                    />
                ) : (
                    <RegisterForm 
                        onRegister={handleRegister} 
                        onSwitchToLogin={() => setAuthView('login')}
                    />
                )}
            </div>
        );
    }

    // Render different views based on currentView state
    switch (currentView) {
        case 'create':
            return <CreateNote onBack={handleBackToNotes} onNoteCreated={handleNoteCreated} />;
        
        case 'edit':
            return <EditNote note={selectedNote} onBack={handleBackToNotes} onNoteUpdated={handleNoteUpdated} />;
        
        case 'view':
            return (
                <ViewNote 
                    note={selectedNote} 
                    onBack={handleBackToNotes} 
                    onEdit={handleEditNote}
                    onDelete={() => {
                        handleBackToNotes();
                        // The delete will be handled by the notes list refresh
                    }}
                />
            );
        
        case 'notes':
        default:
            return (
                <NotesList 
                    user={user} 
                    onLogout={handleLogout}
                    onCreateNote={handleCreateNote}
                    onViewNote={handleViewNote}
                    onEditNote={handleEditNote}
                />
            );
    }
};

// ========================================
// INITIALIZE APP WITH ERROR HANDLING
// ========================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check if React and ReactDOM are available
        if (typeof React === 'undefined') {
            throw new Error('React library not loaded');
        }
        
        if (typeof ReactDOM === 'undefined') {
            throw new Error('ReactDOM library not loaded');
        }

        // Check if the target element exists
        const reactAppElement = document.getElementById('react-app');
        if (!reactAppElement) {
            throw new Error('React app container not found');
        }

        // Initialize React app with error boundary
        const root = ReactDOM.createRoot(reactAppElement);
        
        // Create ErrorBoundary component
        const ErrorBoundary = ({ children }) => {
            const [hasError, setHasError] = React.useState(false);
            const [error, setError] = React.useState(null);

            React.useEffect(() => {
                const handleError = (error, errorInfo) => {
                    console.error('React Error:', error, errorInfo);
                    setHasError(true);
                    setError(error);
                    
                    // Redirect to EJS fallback after delay
                    setTimeout(() => {
                        const currentPath = window.location.pathname;
                        const ejsPath = convertToEJSPath(currentPath);
                        window.location.href = ejsPath;
                    }, 2000);
                };

                // Set up error boundary
                window.reactErrorHandler = handleError;
            }, []);

            if (hasError) {
                return React.createElement('div', {
                    className: 'min-h-screen flex items-center justify-center bg-gray-100'
                }, React.createElement('div', {
                    className: 'text-center p-8 bg-white rounded-lg shadow-md max-w-md mx-4'
                }, [
                    React.createElement('div', {
                        key: 'error-icon',
                        className: 'text-red-500 text-6xl mb-4'
                    }, '⚠️'),
                    React.createElement('h2', {
                        key: 'error-title',
                        className: 'text-2xl font-bold text-gray-800 mb-4'
                    }, 'Something went wrong'),
                    React.createElement('p', {
                        key: 'error-message',
                        className: 'text-gray-600 mb-6'
                    }, 'Redirecting to stable version...'),
                    React.createElement('div', {
                        key: 'loading-spinner',
                        className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'
                    })
                ]));
            }

            return children;
        };

        // Convert React path to EJS path
        const convertToEJSPath = (reactPath) => {
            const pathMap = {
                '/Home': '/home',
                '/Create': '/create',
                '/Note': '/note',
                '/Edit': '/edit',
                '/Monitor': '/monitor'
            };

            if (pathMap[reactPath]) {
                return pathMap[reactPath];
            }

            for (const [reactPattern, ejsPattern] of Object.entries(pathMap)) {
                if (reactPath.startsWith(reactPattern + '/')) {
                    return reactPath.replace(reactPattern, ejsPattern);
                }
            }

            return reactPath.toLowerCase();
        };

        // Wrap the main App component with ErrorBoundary
        const AppWithErrorBoundary = React.createElement(ErrorBoundary, null, 
            React.createElement(App)
        );
        
        root.render(AppWithErrorBoundary);
        
        console.log('React app initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize React app:', error);
        
        // Fallback to EJS version
        setTimeout(() => {
            const currentPath = window.location.pathname;
            const ejsPath = convertToEJSPath(currentPath);
            window.location.href = ejsPath;
        }, 1000);
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
    
    setTimeout(() => {
        const currentPath = window.location.pathname;
        const ejsPath = convertToEJSPath(currentPath);
        window.location.href = ejsPath;
    }, 1000);
});

// Handle global JavaScript errors
window.addEventListener('error', (event) => {
    console.error('Global JavaScript error:', event.error);
    
    if (event.filename && event.filename.includes('react')) {
        setTimeout(() => {
            const currentPath = window.location.pathname;
            const ejsPath = convertToEJSPath(currentPath);
            window.location.href = ejsPath;
        }, 1000);
    }
});
