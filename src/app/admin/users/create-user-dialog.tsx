'use client';

import { useState } from 'react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { UserRoleSchema } from '@/lib/user-profiles';
import { createUserAccount } from '@/lib/user-management';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  email: z.string().email('Ingresa un correo válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  role: UserRoleSchema.default('staff'),
});

interface CreateUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  adminId?: string;
}

export function CreateUserDialog({ isOpen, onOpenChange, adminId }: CreateUserDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'staff',
    },
  });

  const handleClose = () => {
    if (isLoading) return;
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (values: z.infer<typeof createUserSchema>) => {
    if (!adminId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo identificar al administrador.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await createUserAccount({ ...values, createdBy: adminId });
      toast({
        title: 'Usuario creado',
        description: `La cuenta para ${values.name} ha sido creada exitosamente.`,
      });
      handleClose();
    } catch (error: any) {
      let description = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'El correo electrónico ingresado ya está en uso por otra cuenta.';
      }
      toast({
        variant: 'destructive',
        title: 'Error al crear usuario',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa los datos para crear una nueva cuenta. El usuario deberá cambiar su contraseña en el primer inicio de sesión.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario@ejemplo.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Temporal</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pr-10"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
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
                        defaultValue={field.value}
                        className="flex gap-4 pt-2"
                        disabled={isLoading}
                      >
                        <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary">
                          <RadioGroupItem value="staff" /> Staff
                        </Label>
                        <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer flex-1 justify-center has-[:checked]:bg-accent has-[:checked]:border-primary">
                          <RadioGroupItem value="master" /> Maestro
                        </Label>
                      </RadioGroup>
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isLoading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
