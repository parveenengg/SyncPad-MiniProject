/**
 * React Error Boundary and Fallback System
 * Handles React errors gracefully with automatic EJS fallback
 */

// ========================================
// ERROR BOUNDARY COMPONENT
// ========================================
class ErrorBoundary {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('React Error Boundary caught an error:', error, errorInfo);
        
        // Store error details
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Send error to server for logging (optional)
        this.logErrorToServer(error, errorInfo);

        // Attempt automatic fallback after a short delay
        setTimeout(() => {
            this.redirectToEJSFallback();
        }, 2000);
    }

    logErrorToServer(error, errorInfo) {
        try {
            fetch('/api/error-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    error: error.toString(),
                    errorInfo: errorInfo.componentStack,
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            }).catch(err => console.warn('Failed to log error to server:', err));
        } catch (err) {
            console.warn('Failed to send error log:', err);
        }
    }

    redirectToEJSFallback() {
        try {
            const currentPath = window.location.pathname;
            const ejsPath = this.convertToEJSPath(currentPath);
            
            console.log(`Redirecting to EJS fallback: ${currentPath} -> ${ejsPath}`);
            window.location.href = ejsPath;
        } catch (err) {
            console.error('Failed to redirect to EJS fallback:', err);
            // Last resort - redirect to home
            window.location.href = '/home';
        }
    }

    convertToEJSPath(reactPath) {
        // Convert React paths to EJS paths
        const pathMap = {
            '/Home': '/home',
            '/Create': '/create',
            '/Note': '/note',
            '/Edit': '/edit',
            '/Monitor': '/monitor'
        };

        // Check for exact matches first
        if (pathMap[reactPath]) {
            return pathMap[reactPath];
        }

        // Handle dynamic routes (e.g., /Note/123 -> /note/123)
        for (const [reactPattern, ejsPattern] of Object.entries(pathMap)) {
            if (reactPath.startsWith(reactPattern + '/')) {
                return reactPath.replace(reactPattern, ejsPattern);
            }
        }

        // Default fallback
        return reactPath.toLowerCase();
    }

    render() {
        if (this.state.hasError) {
            return React.createElement('div', {
                className: 'min-h-screen flex items-center justify-center bg-gray-100'
            }, [
                React.createElement('div', {
                    key: 'error-container',
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
                    }, 'We\'re redirecting you to a more stable version...'),
                    React.createElement('div', {
                        key: 'loading-spinner',
                        className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'
                    })
                ])
            ]);
        }

        return this.props.children;
    }
}

// ========================================
// REACT INITIALIZATION WITH ERROR HANDLING
// ========================================
const initializeReactApp = () => {
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
};

// ========================================
// UTILITY FUNCTIONS
// ========================================
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

// ========================================
// GLOBAL ERROR HANDLERS
// ========================================

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default behavior (which would log to console)
    event.preventDefault();
    
    // Redirect to EJS fallback
    setTimeout(() => {
        const currentPath = window.location.pathname;
        const ejsPath = convertToEJSPath(currentPath);
        window.location.href = ejsPath;
    }, 1000);
});

// Handle global JavaScript errors
window.addEventListener('error', (event) => {
    console.error('Global JavaScript error:', event.error);
    
    // Only handle errors in React context
    if (event.filename && event.filename.includes('react')) {
        setTimeout(() => {
            const currentPath = window.location.pathname;
            const ejsPath = convertToEJSPath(currentPath);
            window.location.href = ejsPath;
        }, 1000);
    }
});

// ========================================
// EXPORT FOR USE
// ========================================
window.ErrorBoundary = ErrorBoundary;
window.initializeReactApp = initializeReactApp;
