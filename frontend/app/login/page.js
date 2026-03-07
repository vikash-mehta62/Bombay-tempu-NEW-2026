'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Truck, Lock, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'phone'
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [phoneCredentials, setPhoneCredentials] = useState({
    phone: '',
    password: '',
    role: 'driver' // driver, fleet_owner, client
  });
  const [loading, setLoading] = useState(false);
  const { login, loginWithPhone } = useAuth();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      toast.error('Please enter both username and password');
      return;
    }
    
    setLoading(true);

    try {
      const result = await login(credentials);
      if (result.success) {
        toast.success('Login successful!');
        // Don't need to do anything, AuthContext will redirect
      } else {
        toast.error(result.message || 'Login failed');
        setLoading(false); // Reset loading on error
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
      setLoading(false); // Reset loading on error
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    
    if (!phoneCredentials.phone || !phoneCredentials.password) {
      toast.error('Please enter phone number and password');
      return;
    }
    
    setLoading(true);

    try {
      const result = await loginWithPhone(phoneCredentials);
      if (result.success) {
        toast.success('Login successful!');
        // Don't need to do anything, AuthContext will redirect
      } else {
        toast.error(result.message || 'Login failed');
        setLoading(false); // Reset loading on error
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
      setLoading(false); // Reset loading on error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Truck Management System
          </h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Type Tabs */}
        <div className="bg-white rounded-t-2xl shadow-xl p-2 flex space-x-2">
          <button
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              loginType === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Admin Login
          </button>
          <button
            onClick={() => setLoginType('phone')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              loginType === 'phone'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            User Login
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-b-2xl shadow-xl p-8">
          {loginType === 'admin' ? (
            // Admin Login Form
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) =>
                      setCredentials({ ...credentials, username: e.target.value })
                    }
                    className="input pl-10"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({ ...credentials, password: e.target.value })
                    }
                    className="input pl-10"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Admin Credentials:
                </p>
                <p className="text-sm text-blue-700">
                  Username: <span className="font-mono font-semibold">mohit</span>
                </p>
                <p className="text-sm text-blue-700">
                  Password: <span className="font-mono font-semibold">33550011</span>
                </p>
              </div>
            </form>
          ) : (
            // Phone Login Form
            <form onSubmit={handlePhoneLogin} className="space-y-6">
              <div>
                <label className="label">Login As</label>
                <select
                  value={phoneCredentials.role}
                  onChange={(e) =>
                    setPhoneCredentials({ ...phoneCredentials, role: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="driver">Driver</option>
                  <option value="fleet_owner">Fleet Owner</option>
                  <option value="client">Client</option>
                </select>
              </div>

              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={phoneCredentials.phone}
                    onChange={(e) =>
                      setPhoneCredentials({ ...phoneCredentials, phone: e.target.value })
                    }
                    className="input pl-10"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={phoneCredentials.password}
                    onChange={(e) =>
                      setPhoneCredentials({ ...phoneCredentials, password: e.target.value })
                    }
                    className="input pl-10"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium mb-2">
                  Default Password:
                </p>
                <p className="text-sm text-green-700">
                  Password: <span className="font-mono font-semibold">12345678</span>
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Use your registered phone number to login
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          © 2026 Truck Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
