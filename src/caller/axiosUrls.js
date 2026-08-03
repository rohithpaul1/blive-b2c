import axios from './axiosConfig';
import { USE_MOCKS, resolveMock } from './mockData';
import { resolveConvex } from './convexClient';

const handleResponseError = (error) => {
    if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
            // Clear authentication data with correct keys
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('userData');
            
            // Don't show error message for auth errors - just clear and let app handle login redirect
            console.log('🔍 401 Authentication error - session cleared');
            
            // Trigger a page refresh to update authentication state
            setTimeout(() => {
                window.location.reload();
            }, 100);
            
            // Throw with auth error flag to handle in components
            throw Object.assign(new Error('Authentication required'), { statusCode: 401, isAuthError: true });
        } else if (status === 403) {  
            throw Object.assign(new Error(`${data.message || 'Access forbidden'}`), { statusCode: 403 });
        } else if (status === 404 && !data.message) {
            throw new Error(`Resource not found`);
        } else if (data.message) {
            throw new Error(`${data.message}`);
        } else if (data.detail) {
            throw new Error(`${data.detail}`);
        } else {
            throw new Error(`Server error (${status})`);
        }
    } else if (error.request) {
        throw new Error(`Network Error: Unable to connect to the server`);
    } else {
        throw new Error(`Request Error: ${error.message || 'Unknown error occurred'}`);
    }
};

const getAPI = async (path) => {
    const cx = await resolveConvex('GET', path);
    if (cx.handled) return cx.result;
    if (USE_MOCKS) return resolveMock('GET', path);
    try {
        const response = await axios.get(path);
        return response.data;
    } catch (error) {
        handleResponseError(error);
    }
};

const postAPI = async (path, data) => {
    const cx = await resolveConvex('POST', path, data);
    if (cx.handled) return cx.result;
    if (USE_MOCKS) return resolveMock('POST', path, data);
    try {
        const response = await axios.post(path, data);
        return response.data;
    } catch (error) {
        handleResponseError(error);
    }
};

const postAPIMedia = async (path, formData) => {
    const cx = await resolveConvex('POST', path, formData);
    if (cx.handled) return cx.result;
    if (USE_MOCKS) return resolveMock('POST', path, formData);
    try {
        const response = await axios.post(path, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        handleResponseError(error);
    }
};

const putAPI = async (path, data = null) => {
    const cx = await resolveConvex('PUT', path, data);
    if (cx.handled) return cx.result;
    if (USE_MOCKS) return resolveMock('PUT', path, data);
    try {
        const response = await axios.put(path, data);
        return response.data;
    } catch (error) {
        handleResponseError(error);
    }
};

const blobFetchURL = async (path) => {
    try {
        const response = await axios.get(path, { responseType: 'blob' });
        return response.data;
    } catch (error) {
        handleResponseError(error);
    }
}

export { getAPI, postAPI, postAPIMedia, putAPI, blobFetchURL };