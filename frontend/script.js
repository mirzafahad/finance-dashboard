// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// Global variables
let categoryChart = null;
let incomeExpenseChart = null;
let allTransactions = [];

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function capitalizeWords(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            // Get detailed error information
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorBody = await response.json();
                console.error('API Error Details:', errorBody);
                if (errorBody.detail) {
                    errorMessage += ` - ${JSON.stringify(errorBody.detail)}`;
                }
            } catch (e) {
                // If error response isn't JSON, just use status
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
    }
}

async function fetchDashboardSummary() {
    return await apiRequest('/dashboard/summary');
}

async function fetchTransactions() {
    return await apiRequest('/transactions?limit=100');
}

async function createTransaction(transactionData) {
    return await apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData)
    });
}

async function deleteTransaction(transactionId) {
    return await apiRequest(`/transactions/${transactionId}`, {
        method: 'DELETE'
    });
}

async function uploadCSV(formData) {
    return await apiRequest('/transactions/upload-csv', {
        method: 'POST',
        body: formData,
        headers: {} // Remove Content-Type to let browser set it for FormData
    });
}

// Dashboard Summary
async function updateDashboardSummary() {
    try {
        const summary = await fetchDashboardSummary();

        document.getElementById('totalIncome').textContent = formatCurrency(summary.total_income);
        document.getElementById('totalExpenses').textContent = formatCurrency(summary.total_expenses);
        document.getElementById('netWorth').textContent = formatCurrency(summary.net_worth);
        document.getElementById('transactionCount').textContent = summary.transaction_count;

    } catch (error) {
        showToast('Failed to load dashboard summary', 'error');
        console.error('Error updating dashboard summary:', error);
    }
}

// Charts
function updateCategoryChart(transactions) {
    const ctx = document.getElementById('categoryChart').getContext('2d');

    // Group expenses by category
    const expensesByCategory = {};
    transactions
        .filter(t => t.transaction_type === 'expense')
        .forEach(t => {
            const category = capitalizeWords(t.category);
            expensesByCategory[category] = (expensesByCategory[category] || 0) + parseFloat(t.amount);
        });

    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
                    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
                    '#ec4899', '#6b7280'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateIncomeExpenseChart(transactions) {
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');

    const totalIncome = transactions
        .filter(t => t.transaction_type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = transactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }

    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [totalIncome, totalExpenses],
                backgroundColor: ['#10b981', '#ef4444'],
                borderColor: ['#059669', '#dc2626'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Transactions List
function renderTransactions(transactions) {
    const container = document.getElementById('transactionsList');

    if (transactions.length === 0) {
        container.innerHTML = '<p class="text-center">No transactions found.</p>';
        return;
    }

    const transactionsHtml = transactions.map(transaction => {
        const amountClass = transaction.transaction_type;
        const categoryBadgeClass = transaction.transaction_type;
        const amountPrefix = transaction.transaction_type === 'expense' ? '-' : '+';

        return `
            <div class="transaction-item">
                <div class="transaction-details">
                    <div class="transaction-description">
                        ${transaction.description}
                    </div>
                    <div class="transaction-meta">
                        <span class="category-badge ${categoryBadgeClass}">
                            ${capitalizeWords(transaction.category)}
                        </span>
                        <span>${formatDateTime(transaction.date)}</span>
                        <span>${capitalizeWords(transaction.transaction_type)}</span>
                    </div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${amountPrefix}${formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-danger" onclick="handleDeleteTransaction(${transaction.id})">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = transactionsHtml;
}

async function loadTransactions() {
    try {
        allTransactions = await fetchTransactions();
        renderTransactions(allTransactions);
        updateCategoryChart(allTransactions);
        updateIncomeExpenseChart(allTransactions);
    } catch (error) {
        showToast('Failed to load transactions', 'error');
        console.error('Error loading transactions:', error);
    }
}

function filterTransactions() {
    const searchTerm = document.getElementById('searchTransactions').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;

    let filteredTransactions = allTransactions.filter(transaction => {
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    renderTransactions(filteredTransactions);
}

// Event Handlers
async function handleDeleteTransaction(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }

    try {
        showLoading();
        await deleteTransaction(transactionId);
        showToast('Transaction deleted successfully');
        await refreshData();
    } catch (error) {
        showToast('Failed to delete transaction', 'error');
        console.error('Error deleting transaction:', error);
    } finally {
        hideLoading();
    }
}

async function handleTransactionSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const transactionData = {
        amount: formData.get('amount'),  // Send as string, let FastAPI convert to Decimal
        description: formData.get('description'),
        category: formData.get('category'),
        transaction_type: formData.get('transactionType'),  // Note: transactionType not transaction_type
        date: new Date().toISOString()  // Add current timestamp
    };

    console.log('Sending transaction data:', transactionData);  // Debug log

    try {
        showLoading();
        await createTransaction(transactionData);
        showToast('Transaction added successfully');
        event.target.reset();
        await refreshData();
    } catch (error) {
        showToast('Failed to add transaction', 'error');
        console.error('Error creating transaction:', error);
        console.error('Full error response:', error);  // More detailed error
    } finally {
        hideLoading();
    }
}

async function handleCSVUpload(event) {
    event.preventDefault();

    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        showToast('Please select a CSV file', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        showLoading();
        const result = await uploadCSV(formData);

        const resultDiv = document.getElementById('uploadResult');
        resultDiv.classList.remove('hidden', 'success', 'error');

        if (result.errors && result.errors.length > 0) {
            resultDiv.classList.add('error');
            resultDiv.innerHTML = `
                <strong>Upload completed with errors:</strong><br>
                Successfully imported: ${result.successful_imports}/${result.total_rows}<br>
                <details>
                    <summary>Errors (${result.errors.length})</summary>
                    <ul>
                        ${result.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </details>
            `;
        } else {
            resultDiv.classList.add('success');
            resultDiv.innerHTML = `
                <strong>Upload successful!</strong><br>
                Successfully imported: ${result.successful_imports}/${result.total_rows} transactions
            `;
        }

        showToast(`CSV uploaded: ${result.successful_imports} transactions imported`);
        event.target.reset();
        await refreshData();

    } catch (error) {
        showToast('Failed to upload CSV', 'error');
        console.error('Error uploading CSV:', error);

        const resultDiv = document.getElementById('uploadResult');
        resultDiv.classList.remove('hidden', 'success');
        resultDiv.classList.add('error');
        resultDiv.innerHTML = `<strong>Upload failed:</strong> ${error.message}`;
    } finally {
        hideLoading();
    }
}

async function refreshData() {
    showLoading();
    try {
        await Promise.all([
            updateDashboardSummary(),
            loadTransactions()
        ]);
    } catch (error) {
        showToast('Failed to refresh data', 'error');
        console.error('Error refreshing data:', error);
    } finally {
        hideLoading();
    }
}

// Category and Transaction Type Sync
function handleCategoryChange() {
    const categorySelect = document.getElementById('category');
    const typeSelect = document.getElementById('transactionType');
    const selectedCategory = categorySelect.value;

    // Auto-select transaction type based on category
    if (selectedCategory) {
        const incomeCategories = ['salary', 'freelance', 'investment', 'other_income'];
        const expenseCategories = ['food', 'transport', 'entertainment', 'utilities', 'rent', 'shopping', 'healthcare', 'education', 'other_expense'];

        if (incomeCategories.includes(selectedCategory)) {
            typeSelect.value = 'income';
        } else if (expenseCategories.includes(selectedCategory)) {
            typeSelect.value = 'expense';
        } else if (selectedCategory === 'transfer') {
            typeSelect.value = 'transfer';
        }
    }
}

function handleTypeChange() {
    const categorySelect = document.getElementById('category');
    const typeSelect = document.getElementById('transactionType');
    const selectedType = typeSelect.value;

    // Clear category when type changes to force user to select appropriate category
    if (selectedType && categorySelect.value) {
        const currentCategory = categorySelect.value;
        const incomeCategories = ['salary', 'freelance', 'investment', 'other_income'];
        const expenseCategories = ['food', 'transport', 'entertainment', 'utilities', 'rent', 'shopping', 'healthcare', 'education', 'other_expense'];

        let isValidCombination = false;

        if (selectedType === 'income' && incomeCategories.includes(currentCategory)) {
            isValidCombination = true;
        } else if (selectedType === 'expense' && expenseCategories.includes(currentCategory)) {
            isValidCombination = true;
        } else if (selectedType === 'transfer' && currentCategory === 'transfer') {
            isValidCombination = true;
        }

        if (!isValidCombination) {
            categorySelect.value = '';
        }
    }
}

// File input label update
function updateFileLabel() {
    const fileInput = document.getElementById('csvFile');
    const fileLabel = document.querySelector('.file-label');

    if (fileInput.files.length > 0) {
        fileLabel.textContent = fileInput.files[0].name;
    } else {
        fileLabel.textContent = 'Choose CSV File';
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    document.getElementById('csvUploadForm').addEventListener('submit', handleCSVUpload);
    document.getElementById('searchTransactions').addEventListener('input', filterTransactions);
    document.getElementById('filterCategory').addEventListener('change', filterTransactions);
    document.getElementById('category').addEventListener('change', handleCategoryChange);
    document.getElementById('transactionType').addEventListener('change', handleTypeChange);
    document.getElementById('csvFile').addEventListener('change', updateFileLabel);

    // Initial data load
    refreshData();
});

// Error handling for uncaught errors
window.addEventListener('error', function(event) {
    console.error('Uncaught error:', event.error);
    showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('An unexpected error occurred', 'error');
});