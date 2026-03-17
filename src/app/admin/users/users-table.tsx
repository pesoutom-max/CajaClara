'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { UserProfile } from '@/lib/user-profiles';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditUserDialog } from './edit-user-dialog';

interface UsersTableProps {
  users: UserProfile[];
  currentUserId?: string;
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const handleStatusChange = (user: UserProfile, isActive: boolean) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.id);

    updateDoc(userRef, { isActive: isActive })
      .then(() => {
        toast({
          title: `Usuario ${isActive ? 'activado' : 'desactivado'}`,
          description: `El estado de ${user.name} ha sido actualizado.`,
        });
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { isActive: isActive },
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Error al actualizar',
          description: 'No tienes permiso para realizar esta acción.',
        });
      });
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Correo</TableHead>
                <TableHead className="hidden sm:table-cell">Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={user.role === 'master' ? 'default' : 'secondary'}>
                        {user.role === 'master' ? 'Maestro' : 'Staff'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={(isChecked) => handleStatusChange(user, isChecked)}
                        disabled={user.id === currentUserId}
                        aria-label={`Activar o desactivar usuario ${user.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={user.id === currentUserId}>
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            Editar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editingUser && (
        <EditUserDialog
          isOpen={!!editingUser}
          onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}
          user={editingUser}
        />
      )}
    </>
  );
}
