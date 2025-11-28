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
    refetchInterval: 10000, // Auto-refresh every 10 seconds for real-time updates
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
