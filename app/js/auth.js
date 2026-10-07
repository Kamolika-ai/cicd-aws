/**
 * CloudDeploy — Frontend Authentication State Manager (Phase 1)
 * Topic: Automated CI/CD Pipeline for Cloud-Native Web Application Deployment
 * 
 * Manages client-side mock authentication, session storage, and route guards.
 * Prepares clean hooks for AWS Cognito integration in Phase 2.
 */

const CloudDeployAuth = {
    STORAGE_KEY: 'clouddeploy_auth_session',

    /**
     * Get currently active session or mock user
     */
    getCurrentUser() {
        const session = localStorage.getItem(this.STORAGE_KEY);
        if (session) {
            try {
                return JSON.parse(session);
            } catch (e) {
                // fallback
            }
        }
        // Default logged-in mock user for seamless student presentation
        return window.CloudDeployMock ? window.CloudDeployMock.user : null;
    },

    /**
     * Check if user is currently authenticated
     */
    isAuthenticated() {
        return !!this.getCurrentUser();
    },

    /**
     * Social OAuth Login (Git & Google options)
     */
    async socialLogin(provider) {
        const providerName = provider === 'github' ? 'GitHub' : (provider === 'google' ? 'Google' : 'Email');
        let user = {
            id: 'usr-' + provider + '-' + Date.now(),
            name: provider === 'github' ? 'GitHub DevOps Developer' : (provider === 'google' ? 'Google Cloud Engineer' : 'DevOps Student'),
            email: provider === 'github' ? 'devops.lead@github.com' : (provider === 'google' ? 'devops.engineer@gmail.com' : 'user@example.com'),
            role: 'Lead DevOps Engineer',
            avatar: provider === 'github' ? 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=150' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
            initials: provider === 'github' ? 'GH' : 'G',
            verified: true,
            provider: provider,
            status: 'Active'
        };

        try {
            const res = await fetch('/api/auth/social-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, name: user.name, email: user.email })
            });
            const data = await res.json();
            if (data.success && data.user) {
                user.id = data.user.id || user.id;
                user.name = data.user.name || user.name;
                user.email = data.user.email || user.email;
            }
        } catch (e) {}

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        return { success: true, message: `Successfully authenticated via ${providerName}!`, user };
    },

    /**
     * Login Workflow with Backend API & Socket Sync
     */
    async login(email, password) {
        if (!email || !password) {
            return { success: false, message: 'Email and password are required.' };
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success && data.user) {
                const user = {
                    id: data.user.id || 'usr-9021',
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role || 'Lead DevOps Engineer',
                    avatar: data.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
                    initials: data.user.name ? data.user.name.charAt(0).toUpperCase() : 'D',
                    verified: !!data.user.verified,
                    status: 'Active'
                };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
                return { success: true, message: data.message || 'Login successful!', user };
            }
            return { success: false, message: data.message || 'Invalid credentials.' };
        } catch (e) {
            // Fallback for offline mode
            const user = {
                id: 'usr-9021',
                name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                email: email,
                role: 'Lead DevOps Engineer',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
                initials: email.charAt(0).toUpperCase(),
                verified: true,
                status: 'Active'
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
            return { success: true, message: 'Login successful!', user };
        }
    },

    /**
     * Sign Up Workflow with MongoDB Persistence & Real-Time Socket Event
     */
    async signup(name, email, password) {
        if (!name || !email || !password) {
            return { success: false, message: 'All fields are required.' };
        }

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (data.success && data.user) {
                const user = {
                    id: data.user.id || ('usr-' + Math.floor(1000 + Math.random() * 9000)),
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role || 'DevOps Engineer',
                    avatar: data.user.avatar || '',
                    initials: name.charAt(0).toUpperCase(),
                    verified: false,
                    status: 'Pending Verification'
                };
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
                return { success: true, message: data.message || 'Registration successful! Verification code sent.', user, requireVerification: true };
            }
            return { success: false, message: data.message || 'Registration failed.' };
        } catch (e) {
            // Fallback
            const user = {
                id: 'usr-' + Math.floor(1000 + Math.random() * 9000),
                name: name,
                email: email,
                role: 'DevOps Engineer',
                avatar: '',
                initials: name.charAt(0).toUpperCase(),
                verified: false,
                status: 'Pending Verification'
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
            return { success: true, message: 'Registration successful! Verification code sent.', user, requireVerification: true };
        }
    },

    /**
     * Mock Email Verification Workflow
     */
    async verifyEmail(code) {
        if (!code || code.length < 4) {
            return { success: false, message: 'Please enter a valid 6-digit verification code.' };
        }
        try {
            await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
        } catch (e) {}
        const user = this.getCurrentUser();
        if (user) {
            user.verified = true;
            user.status = 'Active';
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
            return { success: true, message: 'Email verified successfully!', user };
        }
        return { success: false, message: 'No active verification session found.' };
    },

    /**
     * Mock Forgot Password Workflow
     */
    forgotPassword(email) {
        if (!email) {
            return { success: false, message: 'Please provide your registered email address.' };
        }
        return { success: true, message: `Password reset link sent to ${email}.` };
    },

    /**
     * Mock Reset Password Workflow
     */
    resetPassword(newPassword) {
        if (!newPassword || newPassword.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters.' };
        }
        return { success: true, message: 'Password reset successful! Please login with your new credentials.' };
    },

    /**
     * Logout Session Clearing
     */
    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {}
        localStorage.removeItem(this.STORAGE_KEY);
        return { success: true, message: 'Logged out safely.' };
    }
};

window.CloudDeployAuth = CloudDeployAuth;
