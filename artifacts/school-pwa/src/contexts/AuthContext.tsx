import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { initDb, getUser } from "../lib/db";

interface AuthUser {
  id: string;
  role: "Admin" | "Teacher" | "Principal";
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (role: string, pin: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initDb();
      const storedUserId = localStorage.getItem("schoolpro_user_id");
      if (storedUserId) {
        try {
          const storedUser = await getUser(storedUserId);
          if (storedUser) {
            setUser({ id: storedUser.id, role: storedUser.role as any, name: storedUser.role });
          }
        } catch (err) {
          console.error("Failed to restore user", err);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (role: string, pin: string) => {
    try {
      const u = await getUser(role.toLowerCase());
      if (u && u.pin === pin) {
        setUser({ id: u.id, role: u.role as any, name: u.role });
        localStorage.setItem("schoolpro_user_id", u.id);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("schoolpro_user_id");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
