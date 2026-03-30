/* ========================================
   SMART DATA FILTER - APPLICATION LOGIC
   ======================================== */

(function () {
    'use strict';

    // ─────────── State ───────────
    let state = {
        allData: [],
        filteredData: [],
        currentPage: 1,
        perPage: 10,
        searchQuery: '',
        filters: {
            department: '',
            status: '',
            role: '',
            salaryMin: null,
            salaryMax: null,
            sort: 'name-asc'
        },
        isLoading: false
    };

    // ─────────── DOM References ───────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        searchInput: $('#searchInput'),
        btnClearSearch: $('#btnClearSearch'),
        filterDepartment: $('#filterDepartment'),
        filterStatus: $('#filterStatus'),
        filterRole: $('#filterRole'),
        filterSalaryMin: $('#filterSalaryMin'),
        filterSalaryMax: $('#filterSalaryMax'),
        filterSort: $('#filterSort'),
        btnApply: $('#btnApply'),
        btnReset: $('#btnReset'),
        btnToggleFilters: $('#btnToggleFilters'),
        filterPanel: $('#filterPanel'),
        filterBody: $('#filterBody'),
        activeFilters: $('#activeFilters'),
        tableBody: $('#tableBody'),
        loadingOverlay: $('#loadingOverlay'),
        emptyState: $('#emptyState'),
        pagination: $('#pagination'),
        paginationWrapper: $('#paginationWrapper'),
        resultsInfo: $('#resultsInfo'),
        perPage: $('#perPage'),
        totalRecords: $('#totalRecords'),
        filteredCount: $('#filteredCount')
    };

    // ─────────── Helpers ───────────
    function formatCurrency(num) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(num);
    }

    function formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function debounce(fn, delay = 350) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    }

    function getInitials(name) {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // ─────────── Ajax Simulation ───────────
    function simulateAjaxFetch(filters) {
        return new Promise((resolve) => {
            const delay = 300 + Math.random() * 500; // 300-800ms
            setTimeout(() => {
                let result = [...state.allData];

                // Text search
                if (filters.searchQuery) {
                    const q = filters.searchQuery.toLowerCase();
                    result = result.filter(item =>
                        item.name.toLowerCase().includes(q) ||
                        item.email.toLowerCase().includes(q) ||
                        item.department.toLowerCase().includes(q) ||
                        item.role.toLowerCase().includes(q)
                    );
                }

                // Department filter
                if (filters.department) {
                    // Status filter
                    if (filters.status) {
                        result = result.filter(item => item.status === filters.status);
                    }
                    result = result.filter(item => item.department === filters.department);
                }


                // Role filter
                if (filters.role) {
                    result = result.filter(item => item.role === filters.role);
                }

                // Salary range
                if (filters.salaryMin !== null && filters.salaryMin !== '') {
                    result = result.filter(item => item.salary >= Number(filters.salaryMin));
                }
                if (filters.salaryMax !== null && filters.salaryMax !== '') {
                    result = result.filter(item => item.salary <= Number(filters.salaryMax));
                }

                // Sorting
                const [sortField, sortDir] = filters.sort.split('-');
                const direction = sortDir === 'asc' ? 1 : -1;

                result.sort((a, b) => {
                    let valA, valB;
                    switch (sortField) {
                        case 'name':
                            valA = a.name.toLowerCase();
                            valB = b.name.toLowerCase();
                            return valA.localeCompare(valB, 'vi') * direction;
                        case 'salary':
                            return (a.salary - b.salary) * direction;
                        case 'date':
                            return (new Date(a.joinDate) - new Date(b.joinDate)) * direction;
                        default:
                            return 0;
                    }
                });

                resolve(result);
            }, delay);
        });
    }

    // ─────────── Loading State ───────────
    function showLoading() {
        state.isLoading = true;
        dom.loadingOverlay.classList.add('active');
    }

    function hideLoading() {
        state.isLoading = false;
        dom.loadingOverlay.classList.remove('active');
    }

    // ─────────── Populate Dropdowns ───────────
    function populateDropdowns() {
        // Departments
        const departments = [...new Set(state.allData.map(d => d.department))].sort();
        departments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept;
            opt.textContent = dept;
            dom.filterDepartment.appendChild(opt);
        });

        // Roles
        const roles = [...new Set(state.allData.map(d => d.role))].sort();
        roles.forEach(role => {
            const opt = document.createElement('option');
            opt.value = role;
            opt.textContent = role;
            dom.filterRole.appendChild(opt);
        });
    }

    // ─────────── Render Table ───────────
    function renderTable() {
        const { filteredData, currentPage, perPage, searchQuery } = state;
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageData = filteredData.slice(start, end);

        // Update header stats
        dom.totalRecords.textContent = state.allData.length;
        dom.filteredCount.textContent = filteredData.length;

        // Update results info
        if (filteredData.length > 0) {
            dom.resultsInfo.textContent = `Hiển thị ${start + 1} – ${Math.min(end, filteredData.length)} trong tổng ${filteredData.length}`;
        } else {
            dom.resultsInfo.textContent = 'Không có kết quả';
        }

        // Show/hide empty state
        if (pageData.length === 0) {
            dom.emptyState.style.display = 'block';
            dom.tableBody.innerHTML = '';
            dom.paginationWrapper.style.display = 'none';
            return;
        }

        dom.emptyState.style.display = 'none';
        dom.paginationWrapper.style.display = 'flex';

        // Status maps
        const statusLabels = {
            active: 'Hoạt động',
            inactive: 'Ngừng HĐ',
            pending: 'Chờ xử lý'
        };

        // Build rows
        dom.tableBody.innerHTML = pageData.map((item, idx) => {
            const initials = getInitials(item.name);
            const nameHighlighted = highlightText(item.name, searchQuery);
            const emailHighlighted = highlightText(item.email, searchQuery);
            const deptHighlighted = highlightText(item.department, searchQuery);
            const roleHighlighted = highlightText(item.role, searchQuery);

            return `
                <tr style="animation-delay: ${idx * 0.04}s">
                    <td style="color: var(--text-muted); font-variant-numeric: tabular-nums;">${item.id}</td>
                    <td>
                        <div class="cell-name">
                            <div class="cell-avatar" style="background: ${item.avatarColor}">${initials}</div>
                            <span>${nameHighlighted}</span>
                        </div>
                    </td>
                    <td class="cell-email">${emailHighlighted}</td>
                    <td><span class="cell-department">${deptHighlighted}</span></td>
                    <td class="cell-role">${roleHighlighted}</td>
                    <td class="cell-salary">${formatCurrency(item.salary)}</td>
                    <td>
                        <span class="cell-status status-${item.status}">
                            <span class="status-dot"></span>
                            ${statusLabels[item.status]}
                        </span>
                    </td>
                    <td class="cell-date">${formatDate(item.joinDate)}</td>
                </tr>
            `;
        }).join('');
    }

    // ─────────── Render Pagination ───────────
    function renderPagination() {
        const { filteredData, currentPage, perPage } = state;
        const totalPages = Math.ceil(filteredData.length / perPage);

        if (totalPages <= 1) {
            dom.pagination.innerHTML = '';
            return;
        }

        let pages = [];

        // Previous button
        pages.push(`
            <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}" title="Trang trước">
                <svg viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
        `);

        // Page numbers with ellipsis
        const range = generatePageRange(currentPage, totalPages);
        range.forEach(p => {
            if (p === '...') {
                pages.push('<span class="page-ellipsis">…</span>');
            } else {
                pages.push(`
                    <button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>
                `);
            }
        });

        // Next button
        pages.push(`
            <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" title="Trang sau">
                <svg viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
        `);

        dom.pagination.innerHTML = pages.join('');

        // Bind click events
        dom.pagination.querySelectorAll('.page-btn:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page !== state.currentPage) {
                    state.currentPage = page;
                    renderTable();
                    renderPagination();
                    scrollToResults();
                }
            });
        });
    }

    function generatePageRange(current, total) {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
                range.push(i);
            }
        }

        let prev;
        for (const i of range) {
            if (prev) {
                if (i - prev === 2) {
                    rangeWithDots.push(prev + 1);
                } else if (i - prev !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            prev = i;
        }

        return rangeWithDots;
    }

    function scrollToResults() {
        document.querySelector('.results-section').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    // ─────────── Active Filter Tags ───────────
    function renderActiveFilters() {
        const tags = [];
        const { searchQuery, filters } = state;

        if (searchQuery) {
            tags.push({ label: `Tìm: "${searchQuery}"`, key: 'search' });
        }
        if (filters.department) {
            tags.push({ label: `Phòng: ${filters.department}`, key: 'department' });
        }
        if (filters.status) {
            const labels = { active: 'Hoạt động', inactive: 'Ngừng HĐ', pending: 'Chờ xử lý' };
            tags.push({ label: `Trạng thái: ${labels[filters.status]}`, key: 'status' });
        }
        if (filters.role) {
            tags.push({ label: `Vai trò: ${filters.role}`, key: 'role' });
        }
        if (filters.salaryMin) {
            tags.push({ label: `Lương ≥ ${formatCurrency(filters.salaryMin)}`, key: 'salaryMin' });
        }
        if (filters.salaryMax) {
            tags.push({ label: `Lương ≤ ${formatCurrency(filters.salaryMax)}`, key: 'salaryMax' });
        }

        dom.activeFilters.innerHTML = tags.map(tag => `
            <span class="filter-tag">
                ${tag.label}
                <span class="tag-remove" data-key="${tag.key}" title="Xóa bộ lọc này">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </span>
            </span>
        `).join('');

        // Bind remove
        dom.activeFilters.querySelectorAll('.tag-remove').forEach(el => {
            el.addEventListener('click', () => {
                removeFilter(el.dataset.key);
            });
        });
    }

    function removeFilter(key) {
        switch (key) {
            case 'search':
                state.searchQuery = '';
                dom.searchInput.value = '';
                dom.btnClearSearch.classList.remove('visible');
                break;
            case 'department':
                state.filters.department = '';
                dom.filterDepartment.value = '';
                break;
            case 'status':
                state.filters.status = '';
                dom.filterStatus.value = '';
                break;
            case 'role':
                state.filters.role = '';
                dom.filterRole.value = '';
                break;
            case 'salaryMin':
                state.filters.salaryMin = null;
                dom.filterSalaryMin.value = '';
                break;
            case 'salaryMax':
                state.filters.salaryMax = null;
                dom.filterSalaryMax.value = '';
                break;
        }
        applyFilters();
    }

    // ─────────── Apply Filters (Ajax) ───────────
    async function applyFilters() {
        showLoading();
        state.currentPage = 1;

        const filterPayload = {
            searchQuery: state.searchQuery,
            department: state.filters.department,
            status: state.filters.status,
            role: state.filters.role,
            salaryMin: state.filters.salaryMin,
            salaryMax: state.filters.salaryMax,
            sort: state.filters.sort
        };

        // Log mock Ajax request
        console.log('%c📡 Ajax Request:', 'color: #818cf8; font-weight: bold;', filterPayload);

        try {
            const results = await simulateAjaxFetch(filterPayload);
            state.filteredData = results;

            console.log('%c✅ Ajax Response:', 'color: #34d399; font-weight: bold;', `${results.length} records`);

            renderTable();
            renderPagination();
            renderActiveFilters();
        } catch (err) {
            console.error('Filter error:', err);
        } finally {
            hideLoading();
        }
    }

    // ─────────── Table Header Sorting ───────────
    function setupTableSorting() {
        $$('.th-sortable').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                let sortKey;

                // Map table column to sort key
                switch (field) {
                    case 'name': sortKey = 'name'; break;
                    case 'salary': sortKey = 'salary'; break;
                    case 'joinDate': sortKey = 'date'; break;
                    case 'department': sortKey = 'name'; break;
                    case 'role': sortKey = 'name'; break;
                    case 'status': sortKey = 'name'; break;
                    case 'id': sortKey = 'name'; break;
                    default: sortKey = 'name';
                }

                const currentSort = state.filters.sort;
                const [currentField, currentDir] = currentSort.split('-');

                let newDir;
                if (currentField === sortKey) {
                    newDir = currentDir === 'asc' ? 'desc' : 'asc';
                } else {
                    newDir = 'asc';
                }

                state.filters.sort = `${sortKey}-${newDir}`;
                dom.filterSort.value = state.filters.sort;

                // Update visual indicators
                $$('.th-sortable').forEach(el => el.classList.remove('sort-asc', 'sort-desc'));
                th.classList.add(newDir === 'asc' ? 'sort-asc' : 'sort-desc');

                applyFilters();
            });
        });
    }

    // ─────────── Event Bindings ───────────
    function bindEvents() {
        // Search input with debounce
        dom.searchInput.addEventListener('input', debounce((e) => {
            state.searchQuery = e.target.value.trim();
            dom.btnClearSearch.classList.toggle('visible', state.searchQuery.length > 0);
            applyFilters();
        }, 350));

        // Clear search
        dom.btnClearSearch.addEventListener('click', () => {
            dom.searchInput.value = '';
            state.searchQuery = '';
            dom.btnClearSearch.classList.remove('visible');
            dom.searchInput.focus();
            applyFilters();
        });

        // Filter changes → live update
        dom.filterDepartment.addEventListener('change', (e) => {
            state.filters.department = e.target.value;
            applyFilters();
        });

        dom.filterStatus.addEventListener('change', (e) => {
            state.filters.status = e.target.value;
            applyFilters();
        });

        dom.filterRole.addEventListener('change', (e) => {
            state.filters.role = e.target.value;
            applyFilters();
        });

        dom.filterSalaryMin.addEventListener('change', (e) => {
            state.filters.salaryMin = e.target.value || null;
            applyFilters();
        });

        dom.filterSalaryMax.addEventListener('change', (e) => {
            state.filters.salaryMax = e.target.value || null;
            applyFilters();
        });

        dom.filterSort.addEventListener('change', (e) => {
            state.filters.sort = e.target.value;
            // Clear visual sort on table headers
            $$('.th-sortable').forEach(el => el.classList.remove('sort-asc', 'sort-desc'));
            applyFilters();
        });

        // Apply button
        dom.btnApply.addEventListener('click', () => {
            applyFilters();
        });

        // Reset button
        dom.btnReset.addEventListener('click', () => {
            state.searchQuery = '';
            state.filters = {
                department: '',
                status: '',
                role: '',
                salaryMin: null,
                salaryMax: null,
                sort: 'name-asc'
            };
            state.currentPage = 1;

            dom.searchInput.value = '';
            dom.filterDepartment.value = '';
            dom.filterStatus.value = '';
            dom.filterRole.value = '';
            dom.filterSalaryMin.value = '';
            dom.filterSalaryMax.value = '';
            dom.filterSort.value = 'name-asc';
            dom.btnClearSearch.classList.remove('visible');

            $$('.th-sortable').forEach(el => el.classList.remove('sort-asc', 'sort-desc'));

            applyFilters();
        });

        // Toggle filters
        dom.btnToggleFilters.addEventListener('click', () => {
            dom.filterPanel.classList.toggle('collapsed');
        });

        dom.filterPanel.querySelector('.filter-panel-header').addEventListener('click', (e) => {
            if (e.target.closest('.btn-toggle-filters')) return;
            dom.filterPanel.classList.toggle('collapsed');
        });

        // Per page
        dom.perPage.addEventListener('change', (e) => {
            state.perPage = parseInt(e.target.value);
            state.currentPage = 1;
            renderTable();
            renderPagination();
        });

        // Keyboard shortcut - focus search with /
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== dom.searchInput) {
                e.preventDefault();
                dom.searchInput.focus();
            }
            if (e.key === 'Escape' && document.activeElement === dom.searchInput) {
                dom.searchInput.blur();
            }
        });
    }

    // ─────────── Initialize ───────────
    async function init() {
        showLoading();

        // Simulate initial data load - like an Ajax call to a server
        await new Promise(resolve => setTimeout(resolve, 600));

        state.allData = MOCK_DATABASE;
        state.filteredData = [...state.allData];
        state.perPage = parseInt(dom.perPage.value);

        populateDropdowns();
        bindEvents();
        setupTableSorting();

        // Initial sort
        const [sortField] = state.filters.sort.split('-');
        state.filteredData.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

        renderTable();
        renderPagination();
        renderActiveFilters();
        hideLoading();

        console.log('%c🚀 Smart Data Filter initialized!', 'color: #c084fc; font-size: 14px; font-weight: bold;');
        console.log(`%c📦 Loaded ${state.allData.length} records from mock database`, 'color: #94a3b8;');
        console.log('%c💡 Nhấn "/" để focus vào ô tìm kiếm', 'color: #fbbf24;');
    }

    // Start app
    init();
})();
