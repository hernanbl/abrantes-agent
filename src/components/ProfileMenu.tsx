
import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfileMenuProps {
  userName?: string;
  profileImage?: string;
}

export function ProfileMenu({ userName, profileImage }: ProfileMenuProps) {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  // Log to debug
  console.log("ProfileMenu rendered with image:", profileImage);

  return (
    <Menubar className="border-none bg-transparent">
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer">
          <div className="flex items-center gap-2">
            {userName && (
              <span className="text-sm text-muted-foreground">
                {userName}
              </span>
            )}
            {profileImage ? (
              <div className="relative">
                <img 
                  src={profileImage} 
                  alt={userName || "Perfil de usuario"} 
                  className="h-8 w-8 rounded-full object-cover shadow-[0_0_10px_rgba(117,134,150,0.3)]" 
                />
              </div>
            ) : (
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <UserRound className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </MenubarTrigger>
        <MenubarContent align="end">
          <MenubarItem onClick={handleProfileClick}>
            Mi Perfil
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onClick={handleLogout}>
            Cerrar Sesión
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
