import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { service } from '../services';
import { ServiceError } from '../services/contracts';
import type { Command, Person } from '../models/domain';
import { uiStore } from '../stores/ui';
export const useSession = () =>
  useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        return await service.session();
      } catch (error) {
        if (error instanceof ServiceError && [401, 403].includes(error.status)) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 30000,
    refetchInterval: service.mode === 'api' ? 60000 : false,
  });
export function useSnapshot() {
  const { data: user } = useSession();
  return useQuery({
    queryKey: ['snapshot', user?.id, user?.orgId],
    queryFn: ({ signal }) => service.snapshot(signal),
    enabled: !!user,
    retry: false,
    staleTime: 5000,
  });
}
export function useCommand() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (cmd: Command) => service.execute(cmd),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['snapshot'] });
      uiStore.set({ notice: 'Đã lưu thay đổi trong dữ liệu demo.' });
    },
    onError: async (error) => {
      if (error instanceof ServiceError && error.status === 409)
        await client.invalidateQueries({ queryKey: ['snapshot'] });
    },
  });
}
export function useAuth() {
  const client = useQueryClient();
  const setSession = async (user: Person | null) => {
    await client.cancelQueries();
    client.setQueryData(['session'], user);
    client.removeQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
    uiStore.clear();
  };
  return {
    mode: service.mode,
    login: async (email: string, password: string) => {
      const p = await service.login(email, password);
      await setSession(p);
    },
    register: async (name: string, email: string, password: string) => {
      const p = await service.register(name, email, password);
      await setSession(p);
    },
    logout: async () => {
      let warning = '';
      try {
        await service.logout();
      } catch {
        warning =
          'Đã thoát phiên trên trình duyệt, nhưng chưa xác nhận được thu hồi phiên trên máy chủ.';
      } finally {
        await setSession(null);
      }
      if (warning) uiStore.set({ notice: warning });
    },
    resetDemo: async () => {
      await service.resetDemo();
      await setSession(null);
    },
    logoutAll: async () => {
      let notice = 'Đã thu hồi phiên đăng nhập trên các thiết bị. Vui lòng đăng nhập lại.';
      try {
        await service.logoutAll();
      } catch {
        notice =
          'Đã thoát trên tab này, nhưng chưa xác nhận thu hồi phiên trên các thiết bị khác. Đăng nhập lại để thử lại.';
      } finally {
        await setSession(null);
      }
      uiStore.set({ notice });
    },
    recover: (email: string) => service.recover(email),
    resetPassword: async (email: string, code: string, password: string) => {
      await service.resetPassword(email, code, password);
      await setSession(null);
      if (service.mode === 'api')
        uiStore.set({ notice: 'Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.' });
    },
    changePassword: async (current: string, next: string) => {
      await service.changePassword(current, next);
      if (service.mode === 'api') {
        await setSession(null);
        uiStore.set({ notice: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới.' });
      }
    },
    profile: async (values: Pick<Person, 'name' | 'phone' | 'avatar'>) => {
      const p = await service.profile(values);
      client.setQueryData(['session'], p);
      await client.invalidateQueries({ queryKey: ['snapshot'] });
    },
  };
}
export const useDemoAccounts = () =>
  useQuery({
    queryKey: ['demo-accounts'],
    queryFn: () => service.demoAccounts(),
    enabled: service.mode === 'mock',
  });
export function useLinkActions() {
  const client = useQueryClient();
  return {
    scan: async (file: File) => (await import('../services/qr')).decodeInvitation(file),
    addSecondary: async (viuId: string, email: string) => {
      await service.addSecondary(viuId, email);
      await client.invalidateQueries({ queryKey: ['snapshot'] });
    },
    generate: (id: string) => service.generateLink(id),
    accept: async (code: string) => {
      await service.acceptLink(code);
      await client.invalidateQueries({ queryKey: ['snapshot'] });
    },
    resetPassword: (id: string) => service.resetAccountPassword(id),
  };
}
