import { toast } from 'sonner';

/**
 * Centered error handling for Vitta.
 * Maps backend error codes to user-friendly messages.
 */
export const handleError = (error, defaultMsg = 'Something went wrong') => {
  console.error('[Vitta Error]:', error);

  if (!error.response) {
    toast.error('Network Error: Check your internet connection');
    return;
  }

  const { status, data } = error.response;
  
  // Custom Vitta Error Structure
  if (data?.detail && typeof data.detail === 'object') {
    const { error_code, detail, suggestion } = data.detail;

    switch (error_code) {
      case 'AUTH_ERROR':
        toast.error('Session Expired', { description: detail || 'Please log in again.' });
        if (status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        break;
      case 'ACCOUNT_NOT_FOUND':
        toast.error('Account Not Found', { description: suggestion || 'Please select a valid account.' });
        break;
      case 'DATABASE_ERROR':
        toast.error('Server Trouble', { description: 'We are having trouble reaching the database. Try again in a minute.' });
        break;
      case 'VALIDATION_ERROR':
        toast.error('Invalid Data', { description: detail || 'Please check your input.' });
        break;
      default:
        toast.error(error_code.replace(/_/g, ' '), { description: detail });
    }
  } else if (status === 401) {
    toast.error('Unauthorized', { description: 'Your session may have expired.' });
    localStorage.removeItem('token');
    window.location.href = '/login';
  } else {
    toast.error(data?.detail || defaultMsg);
  }
};
