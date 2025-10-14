import { redirect } from 'next/navigation';

export default function AdminPage() {
  // The base /admin route should not be a page itself.
  // Redirect to the default admin section, which is user management.
  redirect('/admin/users');
}
