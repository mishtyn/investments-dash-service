'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, PieChart, BarChart3, DollarSign } from 'lucide-react';
import { authApi } from '@/lib/api';
import { setAuthToken, setUser, isAuthenticated } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
      return;
    }

    // Check for token in URL (from bot magic link)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      handleTokenLogin(token);
      return;
    }
  }, [router]);

  // Handle token-based login from bot
  const handleTokenLogin = async (token: string) => {
    setIsLoading(true);
    try {
      // Verify short token and get JWT access token
      const response = await fetch('http://localhost:8000/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid or expired token');
      }

      const data = await response.json();
      // Use the access_token returned from verify endpoint (not the short token)
      setAuthToken(data.access_token);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.first_name}!`);
      
      // Clear token from URL
      window.history.replaceState({}, document.title, '/login');
      router.push('/dashboard');
    } catch (error) {
      console.error('Token login error:', error);
      toast.error('Invalid or expired login link. Please try again.');
      // Clear token from URL
      window.history.replaceState({}, document.title, '/login');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo login function for development
  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const demoAuthData = {
        id: 123456789,
        first_name: 'Demo',
        last_name: 'User',
        username: 'demo_user',
        photo_url: '',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'demo_hash',
      };

      const response = await authApi.loginWithTelegram(demoAuthData);
      setAuthToken(response.access_token);
      setUser(response.user);
      toast.success('Successfully logged in with demo account!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Demo login error:', error);
      toast.error('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Background Dummy Dashboards */}
      <div className="absolute inset-0 opacity-20 overflow-hidden">
        <div className="absolute top-10 left-10 bg-white rounded-xl shadow-2xl p-6 w-80 transform -rotate-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Portfolio Overview</h3>
            <TrendingUp className="text-green-500" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-blue-400 to-blue-200 rounded"></div>
            <div className="h-4 bg-gradient-to-r from-green-400 to-green-200 rounded w-3/4"></div>
            <div className="h-4 bg-gradient-to-r from-purple-400 to-purple-200 rounded w-1/2"></div>
          </div>
        </div>

        <div className="absolute top-32 right-20 bg-white rounded-xl shadow-2xl p-6 w-80 transform rotate-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Earnings Chart</h3>
            <BarChart3 className="text-purple-500" />
          </div>
          <div className="space-y-2">
            <div className="flex space-x-2">
              {[40, 60, 45, 70, 55, 80].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-purple-500 to-purple-300 rounded-t"
                  style={{ height: `${height}px` }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-20 left-32 bg-white rounded-xl shadow-2xl p-6 w-72 transform rotate-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Asset Distribution</h3>
            <PieChart className="text-blue-500" />
          </div>
          <div className="flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-purple-400"></div>
          </div>
        </div>

        <div className="absolute bottom-32 right-32 bg-white rounded-xl shadow-2xl p-6 w-64 transform -rotate-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Total Value</h3>
            <DollarSign className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-800">$124,580</div>
          <div className="text-sm text-green-500 mt-2">+12.5% this month</div>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Tracker</h1>
          <p className="text-gray-600">Track and manage your investments with ease</p>
        </div>

        <div className="space-y-6">
          {/* Telegram Bot Login Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.767-1.362 5.001-.169.521-.506.695-.831.712-.704.031-1.238-.465-1.921-.912-.995-.647-1.558-1.05-2.523-1.68-1.117-.727-.393-1.126.244-1.78.167-.171 3.063-2.807 3.12-3.046.007-.03.014-.142-.053-.201-.067-.059-.166-.039-.237-.023-.101.023-1.712 1.086-4.831 3.192-.457.313-.87.466-1.24.458-.408-.009-1.193-.23-1.777-.42-.717-.233-1.286-.356-1.237-.751.025-.206.31-.416.853-.63 3.348-1.459 5.581-2.421 6.7-2.887 3.191-1.33 3.855-1.561 4.287-1.568.095-.001.308.022.446.134.117.094.149.221.165.31-.001.088-.017.317-.032.506z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Login with Telegram Bot</h3>
                <ol className="text-sm text-gray-700 space-y-2 mb-4">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">1.</span>
                    <span>Open your Telegram bot</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">2.</span>
                    <span>Send <code className="bg-white px-2 py-0.5 rounded text-blue-600 font-mono">/start</code> command</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">3.</span>
                    <span>Click the magic link you receive</span>
                  </li>
                </ol>
                
                {/* Open Bot Button */}
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username'}?start=start`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 space-x-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.767-1.362 5.001-.169.521-.506.695-.831.712-.704.031-1.238-.465-1.921-.912-.995-.647-1.558-1.05-2.523-1.68-1.117-.727-.393-1.126.244-1.78.167-.171 3.063-2.807 3.12-3.046.007-.03.014-.142-.053-.201-.067-.059-.166-.039-.237-.023-.101.023-1.712 1.086-4.831 3.192-.457.313-.87.466-1.24.458-.408-.009-1.193-.23-1.777-.42-.717-.233-1.286-.356-1.237-.751.025-.206.31-.416.853-.63 3.348-1.459 5.581-2.421 6.7-2.887 3.191-1.33 3.855-1.561 4.287-1.568.095-.001.308.022.446.134.117.094.149.221.165.31-.001.088-.017.317-.032.506z"/>
                  </svg>
                  <span>Open Telegram Bot</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Or Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or for development</span>
            </div>
          </div>

          {/* Demo Login Button */}
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <span>Continue with Demo Account</span>
            )}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            By logging in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

