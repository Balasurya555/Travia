import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, Settings, Moon, Sun, LogOut } from 'lucide-react';

export default function SettingsMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('lang') || 'English');
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', language);
  }, [language]);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      if (!user?.id) return;
      const { data, error } = await supabase.from('profiles').select('avatar_url').eq('user_id', user.id).maybeSingle();
      if (!mounted) return;
      if (!error && data?.avatar_url) setAvatar(data.avatar_url);
    }
    loadProfile();
    return () => { mounted = false; };
  }, [user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2" aria-label="Settings">
          <Settings className="h-4 w-4" />
          <span className="hidden md:inline">Settings</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="font-medium">{user?.email ?? 'Account'}</div>
              <div className="text-sm text-muted-foreground">Manage your account</div>
            </div>
          </div>
        </div>

        <DropdownMenuLabel>Account</DropdownMenuLabel>

        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" /> Account Details
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate('/profile#contact')}>
          Contact Details
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center justify-between">
            Language Preference
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setLanguage('English')}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('Hindi')}>Hindi</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('Spanish')}>Spanish</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Display</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        >
          {theme === 'light' ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          Theme: {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Danger</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
