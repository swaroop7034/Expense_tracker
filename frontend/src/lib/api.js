import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params }).then(res => res.data);
export const getExpenseById = (id) => api.get(`/expenses/${id}`).then(res => res.data);
export const createExpense = (data) => api.post('/expenses', data).then(res => res.data);
export const updateExpense = ({ id, data }) => api.put(`/expenses/${id}`, data).then(res => res.data);

// Members
export const getMembers = () => api.get('/members').then(res => res.data);
export const createMember = (data) => api.post('/members', data).then(res => res.data);

// Categories
export const getCategories = () => api.get('/categories').then(res => res.data);

// Dashboard
export const getDashboard = () => api.get('/dashboard').then(res => res.data);

// Settlements
export const getSettlements = () => api.get('/settlements').then(res => res.data);
export const getSuggestedSettlements = () => api.get('/settlements/suggested').then(res => res.data);
export const createSettlement = (data) => api.post('/settlements', data).then(res => res.data);

// Activity
export const getActivity = () => api.get('/activity').then(res => res.data);

export default api;
