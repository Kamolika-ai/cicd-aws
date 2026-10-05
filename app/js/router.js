/**
 * CloudDeploy — SPA Client Router & Route Guard (Phase 1)
 * Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
 * 
 * Handles URL hash parsing, navigation dispatching, and route protection.
 */

const CloudDeployRouter = {
    currentRoute: '/dashboard',
    currentParams: {},
    listeners: [],

    init() {
        window.addEventListener('hashchange', () => this.handleRouting());
        this.handleRouting();
    },

    navigate(path) {
        window.location.hash = path;
    },

    getRouteInfo() {
        let hash = window.location.hash.replace('#', '') || '/dashboard';
        if (!hash.startsWith('/')) hash = '/' + hash;

        // Parse parameterized routes e.g. /builds/#125 or /pipelines/pipe-prod
        const parts = hash.split('/').filter(Boolean);
        
        let route = '/' + (parts[0] || 'dashboard');
        let param = parts[1] || null;

        return { path: hash, route, param };
    },

    handleRouting() {
        const { path, route, param } = this.getRouteInfo();
        const auth = window.CloudDeployAuth;

        // Route Guard for protected routes
        const authRoutes = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'];
        const isAuthRoute = authRoutes.includes(route);

        if (!isAuthRoute && auth && !auth.isAuthenticated()) {
            this.navigate('/login');
            return;
        }

        this.currentRoute = route;
        this.currentParams = { id: param };

        // Notify subscribers
        this.listeners.forEach(cb => cb(route, param, path));
    },

    subscribe(callback) {
        this.listeners.push(callback);
    }
};

window.CloudDeployRouter = CloudDeployRouter;
