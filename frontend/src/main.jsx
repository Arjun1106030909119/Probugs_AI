import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// In production on Render, call the API service directly. The static-site
// rewrite is optional; using the backend origin avoids 404s when that rewrite
// has not been synced to an existing Render service.
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl && apiUrl !== '/api') {
    axios.defaults.baseURL = apiUrl.replace(/\/$/, '');
}

// Global Axios Interceptor
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
