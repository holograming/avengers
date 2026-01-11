# Frontend Skill

IronMan이 사용하는 프론트엔드 개발 가이드입니다.
React, Vue, Angular 프레임워크와 현대적인 프론트엔드 개발 패턴을 다룹니다.

## Quick Start

```typescript
// 컴포넌트 개발 시작
const component = {
  framework: "react",
  pattern: "atomic-design",
  styling: "tailwind",
  testing: "react-testing-library"
}
```

---

## 목차

1. [프레임워크 가이드](#1-프레임워크-가이드)
2. [스타일링 패턴](#2-스타일링-패턴)
3. [컴포넌트 설계 원칙](#3-컴포넌트-설계-원칙-atomic-design)
4. [성능 최적화](#4-성능-최적화)
5. [테스트 전략](#5-테스트-전략)
6. [접근성 가이드라인](#6-접근성-가이드라인-a11y)
7. [빌드 및 번들링](#7-빌드-및-번들링)

---

## 1. 프레임워크 가이드

### React

#### 컴포넌트 설계 패턴

**함수형 컴포넌트 (권장)**

```tsx
// components/Button/Button.tsx
import { FC, ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner className="mr-2" />
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
```

**Compound Component 패턴**

```tsx
// components/Card/Card.tsx
import { createContext, useContext, FC, ReactNode } from 'react';

interface CardContextValue {
  variant: 'elevated' | 'outlined';
}

const CardContext = createContext<CardContextValue | null>(null);

const useCardContext = () => {
  const context = useContext(CardContext);
  if (!context) {
    throw new Error('Card compound components must be used within Card');
  }
  return context;
};

interface CardProps {
  children: ReactNode;
  variant?: 'elevated' | 'outlined';
}

const CardRoot: FC<CardProps> = ({ children, variant = 'elevated' }) => {
  const styles = {
    elevated: 'bg-white shadow-lg rounded-xl',
    outlined: 'bg-white border border-gray-200 rounded-xl',
  };

  return (
    <CardContext.Provider value={{ variant }}>
      <div className={styles[variant]}>{children}</div>
    </CardContext.Provider>
  );
};

const CardHeader: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-100">{children}</div>
);

const CardBody: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="px-6 py-4">{children}</div>
);

const CardFooter: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
    {children}
  </div>
);

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

// 사용 예시
// <Card variant="elevated">
//   <Card.Header>Title</Card.Header>
//   <Card.Body>Content</Card.Body>
//   <Card.Footer>Actions</Card.Footer>
// </Card>
```

#### 상태 관리

**Context API + useReducer (중소 규모)**

```tsx
// context/AuthContext.tsx
import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return initialState;
    default:
      return state;
  }
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: Dispatch<AuthAction>;
} | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
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

**Zustand (권장: 간결하고 강력함)**

```tsx
// store/useCartStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      immer((set) => ({
        // State
        items: [],
        isOpen: false,

        // Actions
        addItem: (item) =>
          set((state) => {
            const existingItem = state.items.find((i) => i.id === item.id);
            if (existingItem) {
              existingItem.quantity += 1;
            } else {
              state.items.push({ ...item, quantity: 1 });
            }
          }),

        removeItem: (id) =>
          set((state) => {
            state.items = state.items.filter((i) => i.id !== id);
          }),

        updateQuantity: (id, quantity) =>
          set((state) => {
            const item = state.items.find((i) => i.id === id);
            if (item) {
              item.quantity = Math.max(0, quantity);
            }
          }),

        clearCart: () =>
          set((state) => {
            state.items = [];
          }),

        toggleCart: () =>
          set((state) => {
            state.isOpen = !state.isOpen;
          }),
      })),
      { name: 'cart-storage' }
    ),
    { name: 'CartStore' }
  )
);

// Selectors
export const selectCartTotal = (state: CartStore) =>
  state.items.reduce((total, item) => total + item.price * item.quantity, 0);

export const selectCartItemCount = (state: CartStore) =>
  state.items.reduce((count, item) => count + item.quantity, 0);
```

**Redux Toolkit (대규모 애플리케이션)**

```tsx
// store/features/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userApi } from '@/services/userApi';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface UserState {
  currentUser: User | null;
  users: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  users: [],
  status: 'idle',
  error: null,
};

// Async Thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.getUsers();
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async (userData: Partial<User> & { id: string }, { rejectWithValue }) => {
    try {
      const response = await userApi.updateUser(userData.id, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // updateUser
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
      });
  },
});

export const { setCurrentUser, clearError } = userSlice.actions;
export default userSlice.reducer;
```

#### Hooks 패턴 및 Best Practices

**Custom Hook: Data Fetching**

```tsx
// hooks/useQuery.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseQueryOptions<T> {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  staleTime?: number;
}

interface UseQueryResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
    staleTime = 0,
  } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const lastFetchTime = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async () => {
    const now = Date.now();
    if (staleTime && now - lastFetchTime.current < staleTime) {
      return; // Data is still fresh
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      lastFetchTime.current = Date.now();
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, onSuccess, onError, staleTime]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData, key]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(fetchData, refetchInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetchInterval, enabled, fetchData]);

  return {
    data,
    error,
    isLoading,
    isError: !!error,
    isSuccess: !!data && !error,
    refetch: fetchData,
  };
}
```

**Custom Hook: Form Handling**

```tsx
// hooks/useForm.ts
import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

type ValidationRule<T> = {
  validate: (value: T[keyof T], values: T) => boolean;
  message: string;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  onSubmit: (values: T) => Promise<void> | void;
}

interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  setFieldError: (field: keyof T, error: string) => void;
  resetForm: () => void;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (field: keyof T, value: T[keyof T]): string | undefined => {
      const rules = validationRules[field];
      if (!rules) return undefined;

      for (const rule of rules) {
        if (!rule.validate(value, values)) {
          return rule.message;
        }
      }
      return undefined;
    },
    [validationRules, values]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    for (const field of Object.keys(values) as (keyof T)[]) {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const fieldValue = type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value;

      setValues((prev) => ({ ...prev, [name]: fieldValue }));

      // Clear error on change
      if (errors[name as keyof T]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      const error = validateField(name as keyof T, values[name as keyof T]);
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [validateField, values]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Touch all fields
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      );
      setTouched(allTouched);

      if (!validateAll()) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateAll, onSubmit]
  );

  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
  };
}
```

**Custom Hook: Local Storage Sync**

```tsx
// hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get from local storage then parse stored json or return initialValue
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          window.dispatchEvent(new StorageEvent('storage', { key }));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}
```

### Vue 3

#### Composition API 패턴

```vue
<!-- components/UserProfile.vue -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useNotification } from '@/composables/useNotification';

interface Props {
  userId: string;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
});

const emit = defineEmits<{
  (e: 'update', user: User): void;
  (e: 'delete', id: string): void;
}>();

// Stores
const userStore = useUserStore();

// Composables
const { showSuccess, showError } = useNotification();

// State
const isEditing = ref(false);
const editedName = ref('');
const isLoading = ref(false);

// Computed
const user = computed(() => userStore.getUserById(props.userId));
const canEdit = computed(() => props.editable && !isLoading.value);

// Watchers
watch(
  () => props.userId,
  async (newId) => {
    if (!userStore.getUserById(newId)) {
      await userStore.fetchUser(newId);
    }
  },
  { immediate: true }
);

// Methods
const startEditing = () => {
  if (!user.value) return;
  editedName.value = user.value.name;
  isEditing.value = true;
};

const saveChanges = async () => {
  if (!user.value) return;

  isLoading.value = true;
  try {
    await userStore.updateUser({
      id: user.value.id,
      name: editedName.value,
    });
    emit('update', { ...user.value, name: editedName.value });
    showSuccess('Profile updated successfully');
    isEditing.value = false;
  } catch (error) {
    showError('Failed to update profile');
  } finally {
    isLoading.value = false;
  }
};

const cancelEditing = () => {
  isEditing.value = false;
  editedName.value = '';
};

// Lifecycle
onMounted(() => {
  console.log('UserProfile mounted for user:', props.userId);
});
</script>

<template>
  <div class="user-profile" :class="{ 'user-profile--loading': isLoading }">
    <div v-if="user" class="user-profile__content">
      <img
        :src="user.avatar"
        :alt="user.name"
        class="user-profile__avatar"
      />

      <div v-if="!isEditing" class="user-profile__info">
        <h2 class="user-profile__name">{{ user.name }}</h2>
        <p class="user-profile__email">{{ user.email }}</p>

        <button
          v-if="canEdit"
          @click="startEditing"
          class="btn btn--secondary"
        >
          Edit Profile
        </button>
      </div>

      <form v-else @submit.prevent="saveChanges" class="user-profile__form">
        <input
          v-model="editedName"
          type="text"
          placeholder="Enter name"
          class="input"
          :disabled="isLoading"
        />

        <div class="user-profile__actions">
          <button
            type="submit"
            class="btn btn--primary"
            :disabled="isLoading"
          >
            Save
          </button>
          <button
            type="button"
            @click="cancelEditing"
            class="btn btn--secondary"
            :disabled="isLoading"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>

    <div v-else class="user-profile__loading">
      <LoadingSpinner />
    </div>
  </div>
</template>

<style scoped>
.user-profile {
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-profile--loading {
  opacity: 0.7;
  pointer-events: none;
}

.user-profile__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.user-profile__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
```

#### Pinia 상태 관리

```typescript
// stores/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userApi } from '@/services/userApi';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<User[]>([]);
  const currentUser = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const getUserById = computed(() => {
    return (id: string) => users.value.find(u => u.id === id);
  });

  const isAuthenticated = computed(() => !!currentUser.value);

  const sortedUsers = computed(() => {
    return [...users.value].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Actions
  async function fetchUsers() {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await userApi.getUsers();
      users.value = response.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch users';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchUser(id: string) {
    isLoading.value = true;

    try {
      const response = await userApi.getUser(id);
      const existingIndex = users.value.findIndex(u => u.id === id);

      if (existingIndex >= 0) {
        users.value[existingIndex] = response.data;
      } else {
        users.value.push(response.data);
      }

      return response.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch user';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateUser(userData: Partial<User> & { id: string }) {
    try {
      const response = await userApi.updateUser(userData.id, userData);
      const index = users.value.findIndex(u => u.id === userData.id);

      if (index >= 0) {
        users.value[index] = response.data;
      }

      if (currentUser.value?.id === userData.id) {
        currentUser.value = response.data;
      }

      return response.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update user';
      throw e;
    }
  }

  function setCurrentUser(user: User | null) {
    currentUser.value = user;
  }

  function clearError() {
    error.value = null;
  }

  function $reset() {
    users.value = [];
    currentUser.value = null;
    isLoading.value = false;
    error.value = null;
  }

  return {
    // State
    users,
    currentUser,
    isLoading,
    error,
    // Getters
    getUserById,
    isAuthenticated,
    sortedUsers,
    // Actions
    fetchUsers,
    fetchUser,
    updateUser,
    setCurrentUser,
    clearError,
    $reset,
  };
});
```

### Angular

#### Component 패턴

```typescript
// components/data-table/data-table.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  TrackByFunction,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  width?: string;
  template?: 'text' | 'date' | 'currency' | 'badge';
}

interface SortConfig<T> {
  column: keyof T;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            @for (column of columns; track column.key) {
              <th
                [style.width]="column.width"
                [class.sortable]="column.sortable"
                (click)="column.sortable && onSort(column.key)"
              >
                {{ column.header }}
                @if (sortConfig?.column === column.key) {
                  <span class="sort-icon">
                    {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                  </span>
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (item of data; track trackByFn(item)) {
            <tr
              [class.selected]="selectedItems.has(item)"
              (click)="onRowClick(item)"
            >
              @for (column of columns; track column.key) {
                <td>
                  @switch (column.template) {
                    @case ('date') {
                      {{ item[column.key] | date:'short' }}
                    }
                    @case ('currency') {
                      {{ item[column.key] | currency }}
                    }
                    @case ('badge') {
                      <span class="badge" [class]="'badge--' + item[column.key]">
                        {{ item[column.key] }}
                      </span>
                    }
                    @default {
                      {{ item[column.key] }}
                    }
                  }
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td [colSpan]="columns.length" class="empty-state">
                No data available
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      background: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }

    .data-table th.sortable {
      cursor: pointer;
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #e9ecef;
    }

    .data-table tr.selected {
      background: #e7f5ff;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
  `]
})
export class DataTableComponent<T extends Record<string, unknown>> implements OnChanges {
  @Input({ required: true }) data: T[] = [];
  @Input({ required: true }) columns: Column<T>[] = [];
  @Input() trackByKey: keyof T = 'id' as keyof T;
  @Input() selectable = false;

  @Output() sort = new EventEmitter<SortConfig<T>>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<Set<T>>();

  sortConfig: SortConfig<T> | null = null;
  selectedItems = new Set<T>();

  trackByFn: TrackByFunction<T> = (_, item) => item[this.trackByKey];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      // Clear selection when data changes
      this.selectedItems.clear();
    }
  }

  onSort(column: keyof T): void {
    const direction =
      this.sortConfig?.column === column && this.sortConfig.direction === 'asc'
        ? 'desc'
        : 'asc';

    this.sortConfig = { column, direction };
    this.sort.emit(this.sortConfig);
  }

  onRowClick(item: T): void {
    if (this.selectable) {
      if (this.selectedItems.has(item)) {
        this.selectedItems.delete(item);
      } else {
        this.selectedItems.add(item);
      }
      this.selectionChange.emit(new Set(this.selectedItems));
    }
    this.rowClick.emit(item);
  }
}
```

#### Signal 기반 상태 관리

```typescript
// services/counter.service.ts
import { Injectable, computed, signal } from '@angular/core';

interface CounterState {
  count: number;
  history: number[];
  lastUpdated: Date | null;
}

@Injectable({ providedIn: 'root' })
export class CounterService {
  // Signals (State)
  private readonly state = signal<CounterState>({
    count: 0,
    history: [],
    lastUpdated: null,
  });

  // Computed values (Derived state)
  readonly count = computed(() => this.state().count);
  readonly history = computed(() => this.state().history);
  readonly lastUpdated = computed(() => this.state().lastUpdated);

  readonly isPositive = computed(() => this.count() > 0);
  readonly isNegative = computed(() => this.count() < 0);
  readonly historyLength = computed(() => this.history().length);

  // Actions
  increment(): void {
    this.updateCount(this.count() + 1);
  }

  decrement(): void {
    this.updateCount(this.count() - 1);
  }

  reset(): void {
    this.updateCount(0);
  }

  setCount(value: number): void {
    this.updateCount(value);
  }

  private updateCount(newCount: number): void {
    this.state.update((state) => ({
      count: newCount,
      history: [...state.history, state.count],
      lastUpdated: new Date(),
    }));
  }

  undo(): void {
    const history = this.history();
    if (history.length > 0) {
      const previousCount = history[history.length - 1];
      this.state.update((state) => ({
        count: previousCount,
        history: state.history.slice(0, -1),
        lastUpdated: new Date(),
      }));
    }
  }
}
```

---

## 2. 스타일링 패턴

### CSS-in-JS (styled-components)

```tsx
// components/Button/Button.styled.ts
import styled, { css, DefaultTheme } from 'styled-components';

interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'danger';
  $size?: 'sm' | 'md' | 'lg';
  $fullWidth?: boolean;
}

const sizeStyles = {
  sm: css`
    padding: 8px 16px;
    font-size: 14px;
  `,
  md: css`
    padding: 12px 24px;
    font-size: 16px;
  `,
  lg: css`
    padding: 16px 32px;
    font-size: 18px;
  `,
};

const variantStyles = (theme: DefaultTheme) => ({
  primary: css`
    background-color: ${theme.colors.primary};
    color: white;

    &:hover:not(:disabled) {
      background-color: ${theme.colors.primaryDark};
    }
  `,
  secondary: css`
    background-color: ${theme.colors.gray200};
    color: ${theme.colors.gray900};

    &:hover:not(:disabled) {
      background-color: ${theme.colors.gray300};
    }
  `,
  danger: css`
    background-color: ${theme.colors.error};
    color: white;

    &:hover:not(:disabled) {
      background-color: ${theme.colors.errorDark};
    }
  `,
});

export const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ $size = 'md' }) => sizeStyles[$size]}
  ${({ $variant = 'primary', theme }) => variantStyles(theme)[$variant]}
  ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

// Theme 정의
// styles/theme.ts
export const theme = {
  colors: {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    secondary: '#6B7280',
    error: '#EF4444',
    errorDark: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray900: '#111827',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};
```

### Emotion

```tsx
// components/Card/Card.tsx
/** @jsxImportSource @emotion/react */
import { css, Theme, useTheme } from '@emotion/react';
import { FC, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const cardStyles = (theme: Theme, variant: string, padding: string) => css`
  border-radius: 12px;
  overflow: hidden;

  ${variant === 'elevated' && css`
    background: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
                0 2px 4px -1px rgba(0, 0, 0, 0.06);
  `}

  ${variant === 'outlined' && css`
    background: white;
    border: 1px solid ${theme.colors.gray200};
  `}

  ${variant === 'filled' && css`
    background: ${theme.colors.gray100};
  `}

  ${padding !== 'none' && css`
    padding: ${
      padding === 'sm' ? '12px' :
      padding === 'md' ? '16px' :
      padding === 'lg' ? '24px' : '16px'
    };
  `}
`;

export const Card: FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
}) => {
  const theme = useTheme();

  return (
    <div css={cardStyles(theme, variant, padding)}>
      {children}
    </div>
  );
};
```

### Tailwind CSS

```tsx
// components/Button/Button.tsx
import { FC, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-100 focus-visible:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        link: 'text-blue-600 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button: FC<ButtonProps> = ({
  className,
  variant,
  size,
  isLoading,
  disabled,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
```

### 반응형 디자인

```tsx
// styles/breakpoints.ts
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Tailwind responsive utilities
const ResponsiveCard = () => (
  <div className="
    p-4 md:p-6 lg:p-8
    grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
    gap-4 md:gap-6
  ">
    {/* Card content */}
  </div>
);

// CSS-in-JS responsive
const responsiveStyles = css`
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    padding: 32px;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
`;

// Custom hook for responsive
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
const isDesktop = useMediaQuery('(min-width: 1025px)');
```

---

## 3. 컴포넌트 설계 원칙 (Atomic Design)

### Atomic Design 계층 구조

```
atoms/          # 기본 빌딩 블록 (Button, Input, Label, Icon)
molecules/      # atom 조합 (FormField, SearchBar, Card)
organisms/      # molecule + atom 조합 (Header, Sidebar, ProductList)
templates/      # 레이아웃 구조 (MainLayout, DashboardLayout)
pages/          # 템플릿 + 데이터 (HomePage, ProductPage)
```

### Atoms (원자)

```tsx
// components/atoms/Button/Button.tsx
export const Button: FC<ButtonProps> = ({ children, ...props }) => (
  <button {...props}>{children}</button>
);

// components/atoms/Input/Input.tsx
export const Input: FC<InputProps> = forwardRef((props, ref) => (
  <input ref={ref} {...props} />
));

// components/atoms/Label/Label.tsx
export const Label: FC<LabelProps> = ({ children, htmlFor, required }) => (
  <label htmlFor={htmlFor}>
    {children}
    {required && <span className="text-red-500">*</span>}
  </label>
);

// components/atoms/Icon/Icon.tsx
export const Icon: FC<IconProps> = ({ name, size = 24, className }) => (
  <svg width={size} height={size} className={className}>
    <use href={`/icons.svg#${name}`} />
  </svg>
);
```

### Molecules (분자)

```tsx
// components/molecules/FormField/FormField.tsx
import { FC, ReactNode } from 'react';
import { Label } from '@/components/atoms/Label';
import { Input } from '@/components/atoms/Input';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormField: FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  error,
  required,
  placeholder,
  value,
  onChange,
}) => {
  return (
    <div className="form-field">
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={error ? 'input--error' : ''}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <span id={`${name}-error`} className="form-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

// components/molecules/SearchBar/SearchBar.tsx
import { FC, useState, FormEvent } from 'react';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export const SearchBar: FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search...',
  isLoading,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar" role="search">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
      <Button type="submit" disabled={isLoading} aria-label="Submit search">
        {isLoading ? (
          <Icon name="spinner" className="animate-spin" />
        ) : (
          <Icon name="search" />
        )}
      </Button>
    </form>
  );
};
```

### Organisms (유기체)

```tsx
// components/organisms/Header/Header.tsx
import { FC } from 'react';
import { Logo } from '@/components/atoms/Logo';
import { Navigation } from '@/components/molecules/Navigation';
import { SearchBar } from '@/components/molecules/SearchBar';
import { UserMenu } from '@/components/molecules/UserMenu';

interface HeaderProps {
  user?: User | null;
  onSearch: (query: string) => void;
  onLogout: () => void;
}

export const Header: FC<HeaderProps> = ({ user, onSearch, onLogout }) => {
  return (
    <header className="header" role="banner">
      <div className="header__left">
        <Logo />
        <Navigation />
      </div>

      <div className="header__center">
        <SearchBar onSearch={onSearch} />
      </div>

      <div className="header__right">
        {user ? (
          <UserMenu user={user} onLogout={onLogout} />
        ) : (
          <Button variant="primary" href="/login">
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};

// components/organisms/ProductList/ProductList.tsx
import { FC } from 'react';
import { ProductCard } from '@/components/molecules/ProductCard';
import { Pagination } from '@/components/molecules/Pagination';
import { EmptyState } from '@/components/molecules/EmptyState';

interface ProductListProps {
  products: Product[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onProductClick: (product: Product) => void;
  isLoading?: boolean;
}

export const ProductList: FC<ProductListProps> = ({
  products,
  totalPages,
  currentPage,
  onPageChange,
  onProductClick,
  isLoading,
}) => {
  if (!isLoading && products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try adjusting your search or filters"
        icon="package"
      />
    );
  }

  return (
    <div className="product-list">
      <div className="product-list__grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick(product)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
```

### Templates (템플릿)

```tsx
// components/templates/MainLayout/MainLayout.tsx
import { FC, ReactNode } from 'react';
import { Header } from '@/components/organisms/Header';
import { Sidebar } from '@/components/organisms/Sidebar';
import { Footer } from '@/components/organisms/Footer';

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const MainLayout: FC<MainLayoutProps> = ({
  children,
  showSidebar = true,
}) => {
  const { user, logout } = useAuth();
  const { search } = useSearch();

  return (
    <div className="main-layout">
      <Header user={user} onSearch={search} onLogout={logout} />

      <div className="main-layout__body">
        {showSidebar && <Sidebar />}

        <main className="main-layout__content" role="main">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
};

// components/templates/DashboardLayout/DashboardLayout.tsx
import { FC, ReactNode, useState } from 'react';
import { DashboardHeader } from '@/components/organisms/DashboardHeader';
import { DashboardSidebar } from '@/components/organisms/DashboardSidebar';
import { Breadcrumb } from '@/components/molecules/Breadcrumb';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({
  children,
  title,
  breadcrumbs,
  actions,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? 'dashboard-layout--collapsed' : ''}`}>
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="dashboard-layout__main">
        <DashboardHeader />

        <div className="dashboard-layout__content">
          {breadcrumbs && <Breadcrumb items={breadcrumbs} />}

          <div className="dashboard-layout__header">
            <h1 className="dashboard-layout__title">{title}</h1>
            {actions && <div className="dashboard-layout__actions">{actions}</div>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
```

---

## 4. 성능 최적화

### Code Splitting

```tsx
// React.lazy와 Suspense
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';

// 동적 import
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Settings = lazy(() => import('@/pages/Settings'));
const Analytics = lazy(() => import('@/pages/Analytics'));

// 명명된 export의 경우
const UserProfile = lazy(() =>
  import('@/components/UserProfile').then((module) => ({
    default: module.UserProfile,
  }))
);

// Router에서 사용
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}

// 컴포넌트 레벨에서 지연 로딩
const HeavyChart = lazy(() => import('@/components/HeavyChart'));

function AnalyticsPage() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>

      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart data={analyticsData} />
        </Suspense>
      )}
    </div>
  );
}
```

### Lazy Loading (이미지 및 컴포넌트)

```tsx
// hooks/useLazyLoad.ts
import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useLazyLoad<T extends HTMLElement>({
  threshold = 0.1,
  rootMargin = '100px',
  triggerOnce = true,
}: UseLazyLoadOptions = {}) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible, hasBeenVisible };
}

// components/LazyImage.tsx
interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}

export const LazyImage: FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = '/placeholder.svg',
  className,
}) => {
  const { ref, isVisible } = useLazyLoad<HTMLImageElement>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`lazy-image ${className}`} ref={ref}>
      {/* Placeholder */}
      <img
        src={placeholder}
        alt=""
        className={`lazy-image__placeholder ${isLoaded ? 'hidden' : ''}`}
        aria-hidden="true"
      />

      {/* Actual image */}
      {isVisible && !error && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={`lazy-image__actual ${isLoaded ? 'visible' : ''}`}
        />
      )}

      {error && (
        <div className="lazy-image__error">
          Failed to load image
        </div>
      )}
    </div>
  );
};

// Virtualized List
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize: number;
}

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="virtual-list" style={{ overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Memoization

```tsx
// React.memo: 컴포넌트 리렌더링 방지
import { memo, useMemo, useCallback, FC } from 'react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (id: string) => void;
  onWishlist: (id: string) => void;
}

// 커스텀 비교 함수로 React.memo 사용
export const ProductCard: FC<ProductCardProps> = memo(
  ({ product, onAddToCart, onWishlist }) => {
    // 컴포넌트 내용
    return (
      <div className="product-card">
        <img src={product.image} alt={product.name} />
        <h3>{product.name}</h3>
        <p>{product.price}</p>
        <button onClick={() => onAddToCart(product.id)}>Add to Cart</button>
        <button onClick={() => onWishlist(product.id)}>Wishlist</button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // true를 반환하면 리렌더링 방지
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.price === nextProps.product.price &&
      prevProps.product.stock === nextProps.product.stock
    );
  }
);

// useMemo: 비용이 큰 계산 캐싱
function ProductList({ products, filters }: ProductListProps) {
  // 필터링된 상품 목록 메모이제이션
  const filteredProducts = useMemo(() => {
    console.log('Filtering products...');
    return products.filter((product) => {
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      if (filters.minPrice && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && product.price > filters.maxPrice) {
        return false;
      }
      if (filters.inStock && product.stock === 0) {
        return false;
      }
      return true;
    });
  }, [products, filters]);

  // 정렬된 상품 목록 메모이제이션
  const sortedProducts = useMemo(() => {
    console.log('Sorting products...');
    return [...filteredProducts].sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [filteredProducts, filters.sortBy]);

  // 통계 계산 메모이제이션
  const stats = useMemo(() => ({
    total: sortedProducts.length,
    avgPrice: sortedProducts.reduce((sum, p) => sum + p.price, 0) / sortedProducts.length,
    inStock: sortedProducts.filter((p) => p.stock > 0).length,
  }), [sortedProducts]);

  return (
    <div>
      <ProductStats stats={stats} />
      {sortedProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// useCallback: 함수 참조 안정화
function ParentComponent() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // 콜백 메모이제이션 - 의존성이 변경되지 않으면 같은 참조 유지
  const handleAddToCart = useCallback((productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing) {
        return prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: productId, quantity: 1 }];
    });
  }, []); // 의존성 없음 - 함수 참조 유지

  const handleRemoveFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  // 의존성이 있는 경우
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return;

    await checkoutApi.process(cart);
    setCart([]);
  }, [cart]); // cart가 변경될 때만 새 함수 생성

  return (
    <ProductList
      products={products}
      onAddToCart={handleAddToCart}
      onRemove={handleRemoveFromCart}
    />
  );
}
```

### Virtual DOM 최적화

```tsx
// 1. Key 최적화 - 안정적인 key 사용
// Bad: index를 key로 사용
{items.map((item, index) => (
  <ListItem key={index} item={item} />  // 순서 변경 시 문제
))}

// Good: 고유 ID를 key로 사용
{items.map((item) => (
  <ListItem key={item.id} item={item} />
))}

// 2. Fragment 사용으로 불필요한 DOM 노드 제거
// Bad: 불필요한 div wrapper
function List({ items }) {
  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <span>{item.name}</span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// Good: Fragment 사용
function List({ items }) {
  return (
    <>
      {items.map((item) => (
        <Fragment key={item.id}>
          <span>{item.name}</span>
          <span>{item.value}</span>
        </Fragment>
      ))}
    </>
  );
}

// 3. 조건부 렌더링 최적화
// Bad: 항상 컴포넌트를 렌더링하고 내부에서 null 반환
function ConditionalComponent({ shouldShow, data }) {
  if (!shouldShow) return null;
  return <ExpensiveComponent data={data} />;
}

// Good: 조건부로 컴포넌트 자체를 렌더링
function ParentComponent({ shouldShow, data }) {
  return (
    <div>
      {shouldShow && <ExpensiveComponent data={data} />}
    </div>
  );
}

// 4. 상태 분리로 리렌더링 범위 최소화
// Bad: 모든 상태가 한 컴포넌트에
function BadForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [expensiveData, setExpensiveData] = useState([]);

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <ExpensiveList data={expensiveData} /> {/* 매번 리렌더링 */}
    </div>
  );
}

// Good: 상태를 분리
function GoodForm() {
  return (
    <div>
      <NameInput />
      <EmailInput />
      <ExpensiveListContainer />
    </div>
  );
}

function NameInput() {
  const [name, setName] = useState('');
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}

function ExpensiveListContainer() {
  const [data, setData] = useState([]);
  return <ExpensiveList data={data} />;
}
```

---

## 5. 테스트 전략

### Jest 단위 테스트

```typescript
// utils/formatters.test.ts
import { formatCurrency, formatDate, formatPhoneNumber } from './formatters';

describe('formatCurrency', () => {
  it('should format number as USD currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should handle negative numbers', () => {
    expect(formatCurrency(-99.99)).toBe('-$99.99');
  });

  it('should round to 2 decimal places', () => {
    expect(formatCurrency(10.999)).toBe('$11.00');
  });

  it('should format with custom locale and currency', () => {
    expect(formatCurrency(1234.56, 'de-DE', 'EUR')).toBe('1.234,56 €');
  });
});

describe('formatDate', () => {
  const testDate = new Date('2024-03-15T10:30:00Z');

  it('should format date in short format', () => {
    expect(formatDate(testDate, 'short')).toBe('3/15/24');
  });

  it('should format date in long format', () => {
    expect(formatDate(testDate, 'long')).toBe('March 15, 2024');
  });

  it('should handle string input', () => {
    expect(formatDate('2024-03-15', 'short')).toBe('3/15/24');
  });

  it('should return empty string for invalid date', () => {
    expect(formatDate('invalid', 'short')).toBe('');
  });
});

// hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement count', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });

  it('should respect min and max bounds', () => {
    const { result } = renderHook(() =>
      useCounter(5, { min: 0, max: 10 })
    );

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.increment();
      }
    });

    expect(result.current.count).toBe(10);

    act(() => {
      for (let i = 0; i < 20; i++) {
        result.current.decrement();
      }
    });

    expect(result.current.count).toBe(0);
  });
});
```

### React Testing Library

```tsx
// components/LoginForm/LoginForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

// Mock API
const mockLogin = jest.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  it('should render login form with all fields', () => {
    render(<LoginForm onSubmit={mockLogin} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockLogin} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should show error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockLogin} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ success: true });

    render(<LoginForm onSubmit={mockLogin} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginForm onSubmit={mockLogin} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('should display error message on failed login', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<LoginForm onSubmit={mockLogin} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid credentials/i);
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockLogin} />);

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

// 비동기 컴포넌트 테스트
// components/UserList/UserList.test.tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from './UserList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
];

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json(mockUsers));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('UserList', () => {
  it('should show loading state initially', () => {
    renderWithProviders(<UserList />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
  });

  it('should display users after loading', async () => {
    renderWithProviders(<UserList />);

    const userItems = await screen.findAllByRole('listitem');
    expect(userItems).toHaveLength(2);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should show error state on API failure', async () => {
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    renderWithProviders(<UserList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load users/i);
  });

  it('should filter users by search query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserList />);

    await screen.findAllByRole('listitem');

    await user.type(screen.getByPlaceholderText(/search/i), 'john');

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('should open user details on row click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserList />);

    const userItems = await screen.findAllByRole('listitem');
    await user.click(userItems[0]);

    const modal = screen.getByRole('dialog');
    expect(within(modal).getByText('John Doe')).toBeInTheDocument();
    expect(within(modal).getByText('john@example.com')).toBeInTheDocument();
  });
});
```

### Cypress E2E 테스트

```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', () => {
      // Visit login page
      cy.visit('/login');

      // Fill in form
      cy.findByLabelText(/email/i).type('test@example.com');
      cy.findByLabelText(/password/i).type('password123');

      // Intercept API call
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          token: 'mock-jwt-token',
        },
      }).as('loginRequest');

      // Submit form
      cy.findByRole('button', { name: /sign in/i }).click();

      // Wait for API call
      cy.wait('@loginRequest');

      // Verify redirect
      cy.url().should('include', '/dashboard');

      // Verify user is logged in
      cy.findByText('Test User').should('be.visible');
    });

    it('should show error message for invalid credentials', () => {
      cy.visit('/login');

      cy.findByLabelText(/email/i).type('wrong@example.com');
      cy.findByLabelText(/password/i).type('wrongpassword');

      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { message: 'Invalid email or password' },
      }).as('loginRequest');

      cy.findByRole('button', { name: /sign in/i }).click();

      cy.wait('@loginRequest');

      cy.findByRole('alert').should('contain.text', 'Invalid email or password');
      cy.url().should('include', '/login');
    });

    it('should validate form fields', () => {
      cy.visit('/login');

      // Submit empty form
      cy.findByRole('button', { name: /sign in/i }).click();

      // Check validation messages
      cy.findByText(/email is required/i).should('be.visible');
      cy.findByText(/password is required/i).should('be.visible');

      // Enter invalid email
      cy.findByLabelText(/email/i).type('invalid-email');
      cy.findByRole('button', { name: /sign in/i }).click();

      cy.findByText(/invalid email format/i).should('be.visible');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      // Login first
      cy.login('test@example.com', 'password123');
    });

    it('should logout successfully', () => {
      cy.visit('/dashboard');

      // Open user menu
      cy.findByRole('button', { name: /user menu/i }).click();

      // Click logout
      cy.findByRole('menuitem', { name: /log out/i }).click();

      // Verify redirect to login
      cy.url().should('include', '/login');

      // Verify protected route is inaccessible
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });
  });
});

// cypress/e2e/shopping-cart.cy.ts
describe('Shopping Cart', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.visit('/products');
  });

  it('should add product to cart', () => {
    // Find first product
    cy.findAllByTestId('product-card').first().within(() => {
      cy.findByText('MacBook Pro').should('be.visible');
      cy.findByRole('button', { name: /add to cart/i }).click();
    });

    // Verify cart count updated
    cy.findByTestId('cart-count').should('have.text', '1');

    // Open cart
    cy.findByRole('button', { name: /open cart/i }).click();

    // Verify product in cart
    cy.findByRole('dialog').within(() => {
      cy.findByText('MacBook Pro').should('be.visible');
      cy.findByText('$1,999.00').should('be.visible');
    });
  });

  it('should update quantity in cart', () => {
    // Add product
    cy.findAllByTestId('product-card').first()
      .findByRole('button', { name: /add to cart/i }).click();

    // Open cart
    cy.findByRole('button', { name: /open cart/i }).click();

    // Increase quantity
    cy.findByRole('dialog').within(() => {
      cy.findByRole('button', { name: /increase quantity/i }).click();
      cy.findByRole('button', { name: /increase quantity/i }).click();

      cy.findByTestId('quantity').should('have.text', '3');
      cy.findByTestId('item-total').should('contain.text', '$5,997.00');
    });
  });

  it('should complete checkout flow', () => {
    // Add products
    cy.findAllByTestId('product-card').first()
      .findByRole('button', { name: /add to cart/i }).click();

    // Go to checkout
    cy.findByRole('button', { name: /open cart/i }).click();
    cy.findByRole('button', { name: /proceed to checkout/i }).click();

    // Fill shipping info
    cy.findByLabelText(/address/i).type('123 Main St');
    cy.findByLabelText(/city/i).type('San Francisco');
    cy.findByLabelText(/zip code/i).type('94102');

    // Fill payment info
    cy.findByLabelText(/card number/i).type('4242424242424242');
    cy.findByLabelText(/expiry/i).type('12/25');
    cy.findByLabelText(/cvc/i).type('123');

    // Submit order
    cy.intercept('POST', '/api/orders', {
      statusCode: 200,
      body: { orderId: 'ORD-12345' },
    }).as('createOrder');

    cy.findByRole('button', { name: /place order/i }).click();

    cy.wait('@createOrder');

    // Verify confirmation
    cy.url().should('include', '/order-confirmation');
    cy.findByText(/order placed successfully/i).should('be.visible');
    cy.findByText('ORD-12345').should('be.visible');
  });
});

// cypress/support/commands.ts
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.intercept('POST', '/api/auth/login', {
    statusCode: 200,
    body: {
      user: { id: '1', email, name: 'Test User' },
      token: 'mock-jwt-token',
    },
  }).as('login');

  cy.visit('/login');
  cy.findByLabelText(/email/i).type(email);
  cy.findByLabelText(/password/i).type(password);
  cy.findByRole('button', { name: /sign in/i }).click();
  cy.wait('@login');
  cy.url().should('include', '/dashboard');
});
```

---

## 6. 접근성 가이드라인 (a11y)

### WCAG 2.1 준수

```tsx
// 1. 의미 있는 HTML 구조
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<button onClick={handleClick}>Click me</button>

// 2. 폼 접근성
function AccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form aria-label="Registration form" noValidate onSubmit={handleSubmit}>
      {/* 연결된 레이블 */}
      <div className="form-field">
        <label htmlFor="email">
          Email Address
          <span aria-hidden="true" className="required">*</span>
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : 'email-hint'}
          autoComplete="email"
        />
        <span id="email-hint" className="hint">
          We will never share your email
        </span>
        {errors.email && (
          <span id="email-error" role="alert" className="error">
            {errors.email}
          </span>
        )}
      </div>

      {/* 비밀번호 필드 */}
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <div className="password-wrapper">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            aria-describedby="password-requirements"
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
        <ul id="password-requirements" className="requirements">
          <li>At least 8 characters</li>
          <li>One uppercase letter</li>
          <li>One number</li>
        </ul>
      </div>

      <button type="submit">Register</button>
    </form>
  );
}

// 3. 모달 접근성
function AccessibleModal({ isOpen, onClose, title, children }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 이전 포커스 저장
      previousActiveElement.current = document.activeElement;

      // 모달에 포커스
      modalRef.current?.focus();

      // 배경 스크롤 방지
      document.body.style.overflow = 'hidden';

      // ESC 키로 닫기
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      // 닫힐 때 이전 포커스로 복원
      (previousActiveElement.current as HTMLElement).focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      ref={modalRef}
      tabIndex={-1}
      className="modal"
    >
      {/* 포커스 트랩 시작 */}
      <FocusTrap>
        <div className="modal-content">
          <header className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="modal-close"
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <div id="modal-description" className="modal-body">
            {children}
          </div>
        </div>
      </FocusTrap>

      {/* 배경 클릭으로 닫기 */}
      <div
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
    </div>
  );
}

// 4. 동적 콘텐츠 알림
function NotificationSystem() {
  return (
    <>
      {/* 스크린 리더에게 변경사항 알림 */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* 중요한 알림 */}
      <div
        role="alert"
        aria-live="assertive"
        className="sr-only"
      >
        {errorMessage}
      </div>

      {/* 시각적 알림 */}
      <div className="notifications">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="notification"
            role={notification.type === 'error' ? 'alert' : 'status'}
          >
            {notification.message}
          </div>
        ))}
      </div>
    </>
  );
}
```

### ARIA 속성

```tsx
// 1. 탭 인터페이스
function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs">
      <div role="tablist" aria-label="Content sections">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              // 화살표 키로 탭 이동
              if (e.key === 'ArrowRight') {
                const nextIndex = (index + 1) % tabs.length;
                onChange(tabs[nextIndex].id);
              } else if (e.key === 'ArrowLeft') {
                const prevIndex = (index - 1 + tabs.length) % tabs.length;
                onChange(tabs[prevIndex].id);
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

// 2. 아코디언
function Accordion({ items }) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="accordion">
      {items.map((item) => {
        const isExpanded = expandedItems.has(item.id);

        return (
          <div key={item.id} className="accordion-item">
            <h3>
              <button
                id={`accordion-header-${item.id}`}
                aria-expanded={isExpanded}
                aria-controls={`accordion-panel-${item.id}`}
                onClick={() => toggleItem(item.id)}
                className="accordion-trigger"
              >
                <span>{item.title}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={isExpanded ? 'rotate-180' : ''}
                />
              </button>
            </h3>
            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-header-${item.id}`}
              hidden={!isExpanded}
              className="accordion-content"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 3. 드롭다운 메뉴
function DropdownMenu({ trigger, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0) {
          items[focusedIndex].action();
          setIsOpen(false);
        }
        break;
    }
  };

  return (
    <div className="dropdown" onKeyDown={handleKeyDown}>
      <button
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="dropdown-menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          id="dropdown-menu"
          role="menu"
          aria-orientation="vertical"
          ref={menuRef}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => {
                item.action();
                setIsOpen(false);
              }}
              className={focusedIndex === index ? 'focused' : ''}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              {item.label}
              {item.shortcut && (
                <kbd aria-label={`Keyboard shortcut: ${item.shortcut}`}>
                  {item.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 4. 진행 상태 표시
function ProgressIndicator({ current, total, label }) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="progress">
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label}
        className="progress-bar"
      >
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="progress-text" aria-hidden="true">
        {current} of {total} ({percentage}%)
      </span>
    </div>
  );
}

// 5. 스킵 링크
function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      <a href="#search" className="skip-link">
        Skip to search
      </a>
    </div>
  );
}

// CSS for skip links
// .skip-link {
//   position: absolute;
//   top: -40px;
//   left: 0;
//   background: #000;
//   color: #fff;
//   padding: 8px;
//   z-index: 100;
// }
// .skip-link:focus {
//   top: 0;
// }
```

---

## 7. 빌드 및 번들링

### Vite 설정

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        // SWC를 사용한 빠른 Refresh
        fastRefresh: true,
        // Babel 플러그인 (emotion 등)
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
      }),
      tsconfigPaths(),
      // Gzip 압축
      compression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      // Brotli 압축
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      // 번들 분석 (--analyze 플래그 사용 시)
      mode === 'analyze' &&
        visualizer({
          open: true,
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),

    // 경로 별칭
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@hooks': '/src/hooks',
        '@utils': '/src/utils',
        '@assets': '/src/assets',
      },
    },

    // 빌드 최적화
    build: {
      target: 'esnext',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      rollupOptions: {
        output: {
          // 청크 분할 전략
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            charts: ['recharts', 'd3'],
            utils: ['date-fns', 'lodash-es', 'axios'],
          },
          // 파일 이름 해싱
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
      // 청크 크기 경고
      chunkSizeWarningLimit: 1000,
      // 소스맵 (프로덕션)
      sourcemap: mode !== 'production',
    },

    // 개발 서버
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    // 테스트
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'src/test/'],
      },
    },
  };
});
```

### Webpack 설정

```javascript
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';
const isAnalyze = process.env.ANALYZE === 'true';

module.exports = {
  mode: isDev ? 'development' : 'production',

  entry: {
    main: './src/index.tsx',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev ? '[name].js' : '[name].[contenthash:8].js',
    chunkFilename: isDev ? '[name].chunk.js' : '[name].[contenthash:8].chunk.js',
    assetModuleFilename: 'assets/[hash][ext][query]',
    publicPath: '/',
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },

  module: {
    rules: [
      // TypeScript/JavaScript
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                useBuiltIns: 'usage',
                corejs: 3,
                modules: false,
              }],
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
            plugins: [
              isDev && 'react-refresh/babel',
            ].filter(Boolean),
            cacheDirectory: true,
          },
        },
      },

      // CSS/SCSS
      {
        test: /\.s?css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: /\.module\.\w+$/,
                localIdentName: isDev
                  ? '[name]__[local]--[hash:base64:5]'
                  : '[hash:base64:8]',
              },
            },
          },
          'postcss-loader',
          'sass-loader',
        ],
      },

      // 이미지
      {
        test: /\.(png|jpe?g|gif|webp|avif)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 10kb 이하는 inline
          },
        },
      },

      // SVG
      {
        test: /\.svg$/,
        issuer: /\.[jt]sx?$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [{ removeViewBox: false }],
              },
            },
          },
        ],
      },

      // 폰트
      {
        test: /\.(woff2?|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[hash][ext]',
        },
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: !isDev && {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true,
      },
    }),

    !isDev && new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css',
    }),

    !isDev && new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),

    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.', globOptions: { ignore: ['**/index.html'] } },
      ],
    }),

    isAnalyze && new BundleAnalyzerPlugin(),

    isDev && new (require('@pmmmwh/react-refresh-webpack-plugin'))(),
  ].filter(Boolean),

  optimization: {
    minimize: !isDev,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: { drop_console: true, drop_debugger: true },
          format: { comments: false },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 20,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 30,
        },
        common: {
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
  },

  devServer: {
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },

  devtool: isDev ? 'eval-cheap-module-source-map' : false,

  performance: {
    hints: isDev ? false : 'warning',
    maxAssetSize: 512 * 1024,
    maxEntrypointSize: 512 * 1024,
  },

  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },

  stats: isDev ? 'minimal' : 'normal',
};
```

---

## Best Practices 요약

### 컴포넌트 설계

1. **단일 책임 원칙**: 컴포넌트는 한 가지 일만 수행
2. **Composition over Inheritance**: 상속보다 합성 선호
3. **Props 인터페이스 명확히**: TypeScript로 props 타입 정의
4. **불변성 유지**: 상태 직접 수정 금지

### 성능

1. **측정 우선**: 최적화 전에 항상 측정
2. **Code Splitting**: 경로 및 컴포넌트 레벨에서 분할
3. **메모이제이션 적절히**: 무분별한 memo/useMemo 사용 금지
4. **번들 분석**: 정기적으로 번들 크기 검토

### 접근성

1. **시맨틱 HTML 우선**: div 남용 금지
2. **키보드 내비게이션**: 모든 인터랙션 키보드로 가능하게
3. **ARIA 올바르게**: 필요한 곳에만 적절히 사용
4. **색상 대비**: WCAG AA 기준 충족

### 테스트

1. **사용자 관점**: 구현 세부사항이 아닌 동작 테스트
2. **테스트 피라미드**: 단위 > 통합 > E2E 비율 유지
3. **실패 케이스 포함**: 해피 패스만 테스트하지 않음
4. **접근성 테스트 포함**: jest-axe, cypress-axe 활용

---

## Rules

1. **컴포넌트 크기 제한**: 200줄 이상이면 분할 검토
2. **Props 개수 제한**: 5개 이상이면 객체로 그룹화 검토
3. **중첩 레벨 제한**: JSX 중첩 3레벨 이상이면 컴포넌트 분리
4. **테스트 커버리지**: 최소 80% 유지
5. **번들 크기 모니터링**: 초기 JS 200KB 이하 목표
6. **Lighthouse 점수**: 성능/접근성/Best Practices/SEO 각 90점 이상 목표
