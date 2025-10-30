/**
 * React Detection Middleware
 * Handles React vs EJS routing with proper error handling
 */

const logger = require('../utils/logger');

/**
 * Detects if the client supports React
 * @param {Object} req - Express request object
 * @returns {boolean} - True if React is supported
 */
const detectReactSupport = (req) => {
    try {
        const userAgent = req.headers['user-agent'] || '';
        const accept = req.headers.accept || '';
        
        // Check for bot/crawler patterns
        const botPatterns = [
            /bot/i, /crawler/i, /spider/i, /crawling/i, 
            /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
            /whatsapp/i, /telegram/i, /slackbot/i, /discordbot/i,
            /googlebot/i, /bingbot/i, /yandexbot/i, /baiduspider/i
        ];
        
        const isBot = botPatterns.some(pattern => pattern.test(userAgent));
        
        // Check for API requests (not HTML)
        const isApiRequest = accept.includes('application/json') || 
                           accept.includes('application/xml') ||
                           req.path.startsWith('/api/');
        
        // Check for mobile apps or non-browser clients
        const isMobileApp = userAgent.includes('okhttp') || 
                           userAgent.includes('alamofire') ||
                           userAgent.includes('curl') ||
                           userAgent.includes('wget');
        
        // React support criteria
        const supportsReact = !isBot && 
                             !isApiRequest && 
                             !isMobileApp &&
                             accept.includes('text/html') &&
                             userAgent.includes('Mozilla');
        
        logger.info(`React Detection - UserAgent: ${userAgent.substring(0, 100)}, SupportsReact: ${supportsReact}`);
        
        return supportsReact;
    } catch (error) {
        logger.error('Error in React detection:', error);
        // Default to EJS on error for safety
        return false;
    }
};

/**
 * Middleware to handle React vs EJS routing
 * @param {string} ejsRoute - The EJS fallback route
 * @param {string} reactTemplate - The React template to render
 * @returns {Function} - Express middleware function
 */
const reactRouteHandler = (ejsRoute, reactTemplate) => {
    return (req, res, next) => {
        try {
            if (detectReactSupport(req)) {
                // Render React template
                res.render(reactTemplate, {
                    user: req.session ? {
                        name: req.session.userName,
                        email: req.session.userEmail,
                        id: req.session.userId
                    } : null,
                    error: null,
                    success: null
                });
            } else {
                // Redirect to EJS fallback
                res.redirect(ejsRoute);
            }
        } catch (error) {
            logger.error(`Error in React route handler for ${reactTemplate}:`, error);
            // Fallback to EJS on any error
            res.redirect(ejsRoute);
        }
    };
};

/**
 * Middleware to handle admin React vs EJS routing
 * @param {string} ejsRoute - The EJS fallback route
 * @param {string} reactTemplate - The React template to render
 * @returns {Function} - Express middleware function
 */
const adminReactRouteHandler = (ejsRoute, reactTemplate) => {
    return (req, res, next) => {
        try {
            if (detectReactSupport(req)) {
                // Render React admin template
                res.render(reactTemplate, {
                    user: req.session ? {
                        name: req.session.userName,
                        email: req.session.userEmail,
                        id: req.session.userId,
                        isAdmin: true
                    } : null,
                    error: null,
                    success: null
                });
            } else {
                // Redirect to EJS fallback
                res.redirect(ejsRoute);
            }
        } catch (error) {
            logger.error(`Error in admin React route handler for ${reactTemplate}:`, error);
            // Fallback to EJS on any error
            res.redirect(ejsRoute);
        }
    };
};

/**
 * Error boundary middleware for React routes
 * Catches any errors and redirects to EJS fallback
 */
const reactErrorHandler = (ejsRoute) => {
    return (error, req, res, next) => {
        logger.error('React route error, redirecting to EJS fallback:', error);
        res.redirect(ejsRoute);
    };
};

module.exports = {
    detectReactSupport,
    reactRouteHandler,
    adminReactRouteHandler,
    reactErrorHandler
};
