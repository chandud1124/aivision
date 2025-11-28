# Frontend-Backend Integration Guide

## 🎯 Goal
Connect the React frontend to the FastAPI backend with proper authentication and data flow.

---

## Phase 1: Setup API Client (15 minutes)

### Step 1: Install Required Packages

```bash
# From project root
npm install axios
```

### Step 2: Create API Configuration

**File: `src/lib/api.ts`** (Create this file)

```typescript
import axios from 'axios';

// API Base URL from environment
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Call refresh endpoint (you'll need to add this to backend)
          const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.clear();
          window.location.href = '/auth';
        }
      } else {
        // No refresh token, logout
        localStorage.clear();
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Step 3: Create Environment File

**File: `.env`** (Create in project root)

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Supabase (existing)
VITE_SUPABASE_URL=https://vrvtqflsbloyubhtvjde.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZydnRxZmxzYmxveXViaHR2amRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTk5NjksImV4cCI6MjA3NzA5NTk2OX0.nAEK0F6iOTZDKLdRIBySxo3mnKYzWtK1p59pUTWCPFE
```

---

## Phase 2: Authentication Context (20 minutes)

### Step 1: Create Auth Context

**File: `src/contexts/AuthContext.tsx`** (Create this file)

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name: string;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      // Create form data for OAuth2 password flow
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await api.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token, user: userData } = response.data;

      // Store tokens and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${userData.full_name}`,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.response?.data?.detail || 'Invalid credentials',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await api.post('/api/v1/auth/register', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      toast({
        title: 'Registration successful!',
        description: 'You can now log in with your credentials.',
      });

      // Auto login after registration
      await login(data.username, data.password);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.response?.data?.detail || 'Failed to register',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
    navigate('/auth');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Step 2: Update App.tsx to Include AuthProvider

```typescript
// src/App.tsx
import { AuthProvider } from "./contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
```

### Step 3: Update ProtectedRoute Component

**File: `src/components/ProtectedRoute.tsx`**

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
```

---

## Phase 3: Auth Page Implementation (15 minutes)

### Update Auth.tsx

**File: `src/pages/Auth.tsx`**

```typescript
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Auth() {
  const { login, register, loading } = useAuth();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
    role: 'student',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData.username, loginData.password);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(registerData);
    } catch (error) {
      // Error handled in context
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>AI Campus Attendance</CardTitle>
          <CardDescription>Login or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username</Label>
                  <Input
                    id="reg-username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <Input
                    id="reg-name"
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 4: API Service Hooks (10 minutes)

### Create API Hooks

**File: `src/hooks/useApi.ts`** (Create this file)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Users API
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/api/v1/users');
      return response.data;
    },
  });
};

export const useUser = (userId: number) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
};

// Attendance API
export const useAttendanceRecords = (params?: { user_id?: number; start_date?: string; end_date?: string }) => {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: async () => {
      const response = await api.get('/api/v1/attendance/records', { params });
      return response.data;
    },
  });
};

export const useCheckIn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { user_id: number; verification_method: string; camera_id?: number }) => {
      const response = await api.post('/api/v1/attendance/check-in', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({
        title: 'Check-in successful!',
        description: 'Your attendance has been recorded.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Check-in failed',
        description: error.response?.data?.detail || 'Failed to check in',
      });
    },
  });
};

export const useCheckOut = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.post(`/api/v1/attendance/check-out?user_id=${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({
        title: 'Check-out successful!',
        description: 'Your attendance has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Check-out failed',
        description: error.response?.data?.detail || 'Failed to check out',
      });
    },
  });
};

// Health Check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get('/health');
      return response.data;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });
};
```

---

## Phase 5: Update Dashboard (10 minutes)

### Connect Dashboard to Real Data

**File: `src/pages/Dashboard.tsx`** (Update existing file)

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useAttendanceRecords, useCheckIn, useCheckOut, useHealthCheck } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendanceRecords({
    user_id: user?.id,
  });
  const { data: healthData } = useHealthCheck();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const handleCheckIn = () => {
    if (user) {
      checkInMutation.mutate({
        user_id: user.id,
        verification_method: 'manual',
      });
    }
  };

  const handleCheckOut = () => {
    if (user) {
      checkOutMutation.mutate(user.id);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.full_name}!</h1>
            <p className="text-muted-foreground">Role: {user?.role}</p>
          </div>
          <div className="flex gap-4">
            <Badge variant={healthData?.status === 'healthy' ? 'default' : 'destructive'}>
              {healthData?.status || 'checking...'}
            </Badge>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Mark your attendance</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button 
                onClick={handleCheckIn} 
                disabled={checkInMutation.isPending}
                className="flex-1"
              >
                Check In
              </Button>
              <Button 
                onClick={handleCheckOut} 
                disabled={checkOutMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                Check Out
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Your attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <p>Loading...</p>
              ) : (
                <div>
                  <p className="text-2xl font-bold">
                    {attendanceData?.total || 0} Records
                  </p>
                  <p className="text-muted-foreground">Total attendance entries</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <p>Loading...</p>
            ) : attendanceData?.records?.length > 0 ? (
              <div className="space-y-2">
                {attendanceData.records.slice(0, 5).map((record: any) => (
                  <div key={record.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">
                        {new Date(record.check_in_time).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(record.check_in_time).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge>{record.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No attendance records found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Phase 6: Testing (10 minutes)

### Test Checklist

1. **Start Backend**:
```bash
cd backend
source venv/bin/activate
python main.py
```

2. **Start Frontend**:
```bash
# In another terminal, from project root
npm run dev
```

3. **Test Flow**:
   - [ ] Visit http://localhost:5173
   - [ ] Should redirect to /auth
   - [ ] Register a new user
   - [ ] Should auto-login and redirect to dashboard
   - [ ] See your user info displayed
   - [ ] Click "Check In" - should work
   - [ ] See attendance record appear
   - [ ] Click "Check Out" - should work
   - [ ] Refresh page - should stay logged in
   - [ ] Click "Logout" - should redirect to /auth

---

## 🎉 Success Criteria

Your integration is successful if:

1. ✅ Frontend connects to backend API
2. ✅ Registration works
3. ✅ Login works and stores token
4. ✅ Dashboard shows real data from API
5. ✅ Check-in/Check-out functions work
6. ✅ Protected routes redirect properly
7. ✅ Logout clears session

---

## 🐛 Common Issues

### CORS Error
**Error**: "Access to XMLHttpRequest has been blocked by CORS policy"

**Fix**: Backend CORS is already configured, but verify `.env` has correct URL

### 401 Unauthorized
**Error**: All API calls return 401

**Fix**: Check token is being stored and sent correctly. Check browser DevTools > Application > Local Storage

### Connection Refused
**Error**: "ERR_CONNECTION_REFUSED"

**Fix**: Make sure backend is running on port 8000

---

## 📚 Next Steps

After basic integration works:

1. Connect Users page to API
2. Add user creation/editing forms
3. Implement face recognition upload
4. Add analytics charts
5. Implement WebSocket for real-time updates

---

*See IMPROVEMENTS_ROADMAP.md for full feature roadmap*
