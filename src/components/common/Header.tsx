import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileCog, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <FileCog className="h-6 w-6 text-primary" />
            <span className="font-bold">DocuEase</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button>
            Go Premium
            <span aria-hidden="true" className="ml-2">
              🚀
            </span>
          </Button>
          <Avatar>
            <AvatarImage src="https://picsum.photos/seed/user/100/100" />
            <AvatarFallback>
              <UserCircle />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
