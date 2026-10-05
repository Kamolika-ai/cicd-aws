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
     * Mock Login Workflow
     */
    login(email, password) {
        if (!email || !password) {
            return { success: false, message: 'Email and password are required.' };
        }
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
    },

    /**
     * Mock Sign Up Workflow
     */
    signup(name, email, password) {
        if (!name || !email || !password) {
            return { success: false, message: 'All fields are required.' };
        }
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
    },

    /**
     * Mock Email Verification Workflow
     */
    verifyEmail(code) {
        if (!code || code.length < 4) {
            return { success: false, message: 'Please enter a valid 6-digit verification code.' };
        }
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
    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        return { success: true, message: 'Logged out safely.' };
    }
};

window.CloudDeployAuth = CloudDeployAuth;
