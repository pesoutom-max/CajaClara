'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile, UserRoleSchema } from '@/lib/user-profiles';

const editUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  role: UserRoleSchema,
  isActive: z.boolean(),
  mustChangePassword: z.boolean(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: UserProfile;
  currentUserId?: string;
}

export function EditUserDialog({ isOpen, onOpenChange, user, currentUserId }: EditUserDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const isEditingSelfAsMaster = user.id === currentUserId && user.role === 'master';

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      role: 'staff',
      isActive: true,
      mustChangePassword: false,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      });
    }
  }, [user, form]);

  const handleClose = () => {
    if (isLoading) return;
    onOpenChange(false);
  };

  const onSubmit = async (values: EditUserFormValues) => {
    if (!firestore || !user) return;
    setIsLoading(true);

    const userRef = doc(firestore, 'users', user.id);
    updateDoc(userRef, values)
      .then(() => {
        toast({
          title: 'Usuario actualizado',
          description: `Los datos de ${values.name} han sido actualizados.`,
        });
        handleClose();
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: values
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Error al actualizar',
          description: 'No tienes permiso para realizar esta acción o ocurrió un error.',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Modifica los datos del perfil de {user.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <Input value={user.email} disabled />
                <p className="text-xs text-muted-foreground">El correo no se puede cambiar.</p>
              </FormItem>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-4 pt-2"
                        disabled={isLoading || isEditingSelfAsMaster}
                      >
                        <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary">
                          <RadioGroupItem value="staff" /> Staff
                        </Label>
                        <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary">
                          <RadioGroupItem value="master" /> Maestro
                        </Label>
                      </RadioGroup>
                    </FormControl>
                     {isEditingSelfAsMaster && <FormDescription>No puedes cambiar tu propio rol de maestro.</FormDescription>}
                     <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Cuenta Activa</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Permite al usuario iniciar sesión en la aplicación.
                    {isEditingSelfAsMaster && <span className="block font-medium text-amber-600 mt-1">No puedes desactivar tu propia cuenta.</span>}
                  </p>
                </div>
                 <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading || isEditingSelfAsMaster}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-between items-center rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Forzar cambio de contraseña</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Exigirá al usuario cambiar su clave la próxima vez que inicie sesión.
                  </p>
                </div>
                 <FormField
                  control={form.control}
                  name="mustChangePassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isLoading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
