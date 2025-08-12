//frontend\components\OTPVerification.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

export default function OTPVerification({ email, purpose = 'register' }) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await authAPI.verifyOTP({ email, otp });

      if (response.success) {
        setMessage(response.message);
        toast.success(response.message);
        
        // Redirect based on purpose
        if (purpose === 'register') {
          router.push('/auth/login');
        } else if (purpose === 'reset') {
          // For password reset, we need to pass the email and OTP to the reset password page
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`);
        }
      } else {
        const errorMsg = response.error || response.message || 'Verification failed';
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'An error occurred during verification';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await authAPI.sendOTP({ email });

      if (response.success) {
        const successMsg = 'New OTP sent successfully';
        setMessage(successMsg);
        toast.success(successMsg);
      } else {
        const errorMsg = response.error || response.message || 'Failed to resend OTP';
        setMessage(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMsg = 'An error occurred while resending OTP';
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">OTP Verification</h2>
        <p className="mb-6 text-center text-gray-600">
          We've sent an OTP to <span className="font-medium">{email}</span>
        </p>
        
        <form onSubmit={handleVerifyOTP}>
          <div className="mb-6">
            <label htmlFor="otp" className="block mb-2 text-sm font-medium text-gray-700">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg font-mono"
              placeholder="Enter 6-digit code"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={handleResendOTP}
            disabled={isLoading}
            className="text-green-600 hover:text-green-700 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Resend OTP
          </button>
        </div>
        
        {message && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            message.includes('success') || message.includes('successfully') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};