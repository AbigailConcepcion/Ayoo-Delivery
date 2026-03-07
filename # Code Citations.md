# Code Citations

## License: unknown
https://github.com/abdullohsiddiqov/luxury.h.site/blob/4b196222007fca234fa36d72f32f08b1cd25f83a/src/hooks/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check
```


## License: unknown
https://github.com/abdullohsiddiqov/luxury.h.site/blob/4b196222007fca234fa36d72f32f08b1cd25f83a/src/hooks/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check
```


## License: unknown
https://github.com/ducnguyenhong/next-auth-jwt-page/blob/7b77511915206d91acc3b8fe0c94bc2713d5f536/src/auth/context.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session
```


## License: unknown
https://github.com/abdullohsiddiqov/luxury.h.site/blob/4b196222007fca234fa36d72f32f08b1cd25f83a/src/hooks/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check
```


## License: unknown
https://github.com/ducnguyenhong/next-auth-jwt-page/blob/7b77511915206d91acc3b8fe0c94bc2713d5f536/src/auth/context.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session
```


## License: unknown
https://github.com/AdrianF3/my-dashboard/blob/0ac1fd3b99b69714e173b2de3e5ef4ae5ef914ce/src/contexts/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = session
```


## License: unknown
https://github.com/abdullohsiddiqov/luxury.h.site/blob/4b196222007fca234fa36d72f32f08b1cd25f83a/src/hooks/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check
```


## License: unknown
https://github.com/ducnguyenhong/next-auth-jwt-page/blob/7b77511915206d91acc3b8fe0c94bc2713d5f536/src/auth/context.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session
```


## License: unknown
https://github.com/AdrianF3/my-dashboard/blob/0ac1fd3b99b69714e173b2de3e5ef4ae5ef914ce/src/contexts/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = session
```


## License: unknown
https://github.com/abdullohsiddiqov/luxury.h.site/blob/4b196222007fca234fa36d72f32f08b1cd25f83a/src/hooks/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check
```


## License: unknown
https://github.com/ducnguyenhong/next-auth-jwt-page/blob/7b77511915206d91acc3b8fe0c94bc2713d5f536/src/auth/context.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session
```


## License: unknown
https://github.com/AdrianF3/my-dashboard/blob/0ac1fd3b99b69714e173b2de3e5ef4ae5ef914ce/src/contexts/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = session
```


## License: unknown
https://github.com/abdullohsiddiqov/luxury.h.site/blob/4b196222007fca234fa36d72f32f08b1cd25f83a/src/hooks/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check
```


## License: unknown
https://github.com/ducnguyenhong/next-auth-jwt-page/blob/7b77511915206d91acc3b8fe0c94bc2713d5f536/src/auth/context.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session
```


## License: unknown
https://github.com/AdrianF3/my-dashboard/blob/0ac1fd3b99b69714e173b2de3e5ef4ae5ef914ce/src/contexts/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = session
```


## License: unknown
https://github.com/ducnguyenhong/next-auth-jwt-page/blob/7b77511915206d91acc3b8fe0c94bc2713d5f536/src/auth/context.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session
```


## License: unknown
https://github.com/abdullohsiddiqov/luxury.h.site/blob/4b196222007fca234fa36d72f32f08b1cd25f83a/src/hooks/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session
```


## License: unknown
https://github.com/AdrianF3/my-dashboard/blob/0ac1fd3b99b69714e173b2de3e5ef4ae5ef914ce/src/contexts/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = session
```


## License: unknown
https://github.com/ducnguyenhong/next-auth-jwt-page/blob/7b77511915206d91acc3b8fe0c94bc2713d5f536/src/auth/context.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session
```


## License: unknown
https://github.com/abdullohsiddiqov/luxury.h.site/blob/4b196222007fca234fa36d72f32f08b1cd25f83a/src/hooks/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session
```


## License: unknown
https://github.com/AdrianF3/my-dashboard/blob/0ac1fd3b99b69714e173b2de3e5ef4ae5ef914ce/src/contexts/AuthContext.tsx

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = session
```


## License: unknown
https://github.com/Merkie/freespeech/blob/97f334f03e32384384aac3989cb869c5be2f46f1/src/routes/login/email/%2Bpage.svelte

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = sessionStorage.getItem('user'); // Use sessionStorage, not localStorage
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLo
```


## License: unknown
https://github.com/mmcclatchy/triply/blob/91222af1ec6736adb9a0fa26dd58977b0f1f8a96/react-app/src/services/auth.js

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = sessionStorage.getItem('user'); // Use sessionStorage, not localStorage
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLo
```


## License: unknown
https://github.com/rsdimatulac/SlackX/blob/edf4d94299ca0f32ba5198f95e61872e133504e2/react-app/src/store/session.js

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = sessionStorage.getItem('user'); // Use sessionStorage, not localStorage
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLo
```


## License: unknown
https://github.com/Merkie/freespeech/blob/97f334f03e32384384aac3989cb869c5be2f46f1/src/routes/login/email/%2Bpage.svelte

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = sessionStorage.getItem('user'); // Use sessionStorage, not localStorage
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLo
```


## License: unknown
https://github.com/mmcclatchy/triply/blob/91222af1ec6736adb9a0fa26dd58977b0f1f8a96/react-app/src/services/auth.js

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = sessionStorage.getItem('user'); // Use sessionStorage, not localStorage
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLo
```


## License: unknown
https://github.com/rsdimatulac/SlackX/blob/edf4d94299ca0f32ba5198f95e61872e133504e2/react-app/src/store/session.js

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = sessionStorage.getItem('user'); // Use sessionStorage, not localStorage
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLo
```


## License: unknown
https://github.com/Merkie/freespeech/blob/97f334f03e32384384aac3989cb869c5be2f46f1/src/routes/login/email/%2Bpage.svelte

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = sessionStorage.getItem('user'); // Use sessionStorage, not localStorage
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLo
```


## License: unknown
https://github.com/mmcclatchy/triply/blob/91222af1ec6736adb9a0fa26dd58977b0f1f8a96/react-app/src/services/auth.js

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = sessionStorage.getItem('user'); // Use sessionStorage, not localStorage
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLo
```


## License: unknown
https://github.com/rsdimatulac/SlackX/blob/edf4d94299ca0f32ba5198f95e61872e133504e2/react-app/src/store/session.js

```
I'll help you fix the authentication system to prevent persistence after logout and implement proper role-based access control. First, let me ask a clarifying question:

**What authentication system are you currently using?** (Firebase, custom backend, NextAuth, etc.) and **where is your login/logout logic currently implemented?**

In the meantime, here's a general approach to fix these issues:

```typescript
// filepath: /home/abiconcepcion/Projects/Ayoo-Delivery/src/contexts/AuthContext.tsx (or similar)
import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'customer' | 'merchant' | 'rider' | null;

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only check for persisted session on mount, never restore after logout
    const checkAuth = async () => {
      const savedUser = sessionStorage.getItem('user'); // Use sessionStorage, not localStorage
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          sessionStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLo
```

