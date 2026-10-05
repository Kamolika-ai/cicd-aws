// Initialize Lucide Icons
lucide.createIcons();

// DOM Elements
const pageContainer = document.getElementById('page-container');
const topbarTitle = document.getElementById('topbar-title');
const navItems = document.querySelectorAll('.nav-item');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.querySelector('.sidebar');
const toastContainer = document.getElementById('toast-container');

// State
let currentPage = 'dashboard';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadPage('dashboard');
    setupNavigation();
    setupMobileMenu();
});

// Navigation & Routing
function setupNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Close mobile menu if open
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
            
            loadPage(page);
        });
    });
}

function setupMobileMenu() {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
}

function loadPage(pageId) {
    currentPage = pageId;
    
    // Update Title
    const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (activeNav) {
        topbarTitle.textContent = activeNav.textContent.trim();
    }
    
    // Load Template
    const templateId = `tpl-${pageId}`;
    const template = document.getElementById(templateId);
    
    if (template) {
        pageContainer.innerHTML = '';
        pageContainer.appendChild(template.content.cloneNode(true));
        
        // Re-initialize icons for newly added content
        lucide.createIcons();
    } else {
        // Fallback Empty State
        pageContainer.innerHTML = `
            <div class="card flex flex-col align-center justify-center" style="min-height: 400px; text-align: center;">
                <i data-lucide="layout" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                <h3 style="margin-bottom: 8px;">Coming Soon</h3>
                <p class="text-muted">This section is currently under development.</p>
            </div>
        `;
        lucide.createIcons();
    }
}

// Toast Notifications System
window.showToast = function(type, title, message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let iconClass = '';
    let iconName = '';
    
    if (type === 'success') {
        iconClass = 'success';
        iconName = 'check-circle';
    } else if (type === 'error') {
        iconClass = 'error';
        iconName = 'x-circle';
    } else {
        iconClass = 'info';
        iconName = 'info';
    }
    
    toast.innerHTML = `
        <div class="toast-icon ${iconClass}">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}

// Pipeline Simulation Logic
window.runPipeline = function() {
    // Show toast
    window.showToast('info', 'Pipeline Started', 'Production pipeline #125 has been triggered.');
    
    // Check if we are on dashboard
    if (currentPage !== 'dashboard') return;
    
    // Update badge status
    const statusBadge = document.getElementById('pipeline-status-badge');
    if (statusBadge) {
        statusBadge.className = 'badge badge-warning';
        statusBadge.innerHTML = '<span class="status-dot"></span> RUNNING';
    }
    
    // Reset all nodes
    const nodes = ['source', 'build', 'test', 'docker', 'deploy', 'prod'];
    nodes.forEach((node, index) => {
        const el = document.getElementById(`node-${node}`);
        if (el) el.className = 'pipeline-node pending';
        
        if (index > 0) {
            const conn = document.getElementById(`conn-${index}`);
            if (conn) conn.className = 'pipeline-connector pending';
        }
    });
    
    // Simulate pipeline progression
    simulateStage(0, nodes);
}

function simulateStage(index, nodes) {
    if (index >= nodes.length) {
        // Pipeline completed
        const statusBadge = document.getElementById('pipeline-status-badge');
        if (statusBadge) {
            statusBadge.className = 'badge badge-success';
            statusBadge.innerHTML = '<span class="status-dot"></span> SUCCESS';
        }
        window.showToast('success', 'Deployment successful', 'Production v1.0.5 is now live.');
        return;
    }
    
    const currentNode = nodes[index];
    const nodeEl = document.getElementById(`node-${currentNode}`);
    
    if (nodeEl) {
        // Set current node to running
        nodeEl.className = 'pipeline-node running';
        
        // If there's a connector connecting to this node (index > 0)
        if (index > 0) {
            const connEl = document.getElementById(`conn-${index}`);
            if (connEl) connEl.className = 'pipeline-connector running';
        }
        
        // Simulate time taken for this stage
        const stageTime = Math.random() * 1500 + 1000; // 1-2.5s
        
        setTimeout(() => {
            // Set current node to success
            nodeEl.className = 'pipeline-node success';
            
            if (index > 0) {
                const connEl = document.getElementById(`conn-${index}`);
                if (connEl) connEl.className = 'pipeline-connector success';
            }
            
            // Move to next stage
            simulateStage(index + 1, nodes);
        }, stageTime);
    }
}

// Global Actions for UI interactions
window.showBuildDetails = function(buildId) {
    // In a real app, this would route to a detail page
    window.showToast('info', 'View Build', `Opening details for build ${buildId}...`);
}
