"use client";
import { createContext, useContext } from 'react';
import { api } from '@/lib/api';
import type { AxiosInstance } from 'axios';

// Context chỉ thay nguồn dữ liệu của giao diện; không thay quyền API hoặc cookie thật.
export const AdminEnvironment = createContext<{
  client: AxiosInstance;
  basePath: string;
  demo?: { reset: () => void; exit: () => void };
}>({ client: api, basePath: '/admin' });
export const useAdminEnvironment = () => useContext(AdminEnvironment);
