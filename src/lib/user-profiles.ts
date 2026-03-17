
import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview Defines the data structure and types for user profiles in Firestore.
 * This file establishes a clear schema for documents stored in the `users/{uid}` collection.
 *
 * Exports:
 * - UserProfileSchema: A Zod schema for validating user profile data.
 * - UserProfile: The TypeScript type inferred from the schema.
 * - UserRole: A Zod enum for user roles ('master', 'staff').
 */

/**
 * Defines the possible roles a user can have within the application.
 * - `master`: Has full administrative control.
 * - `staff`: Has limited operational permissions.
 */
export const UserRoleSchema = z.enum(['master', 'staff']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * Zod schema for a user profile document stored in `users/{uid}`.
 */
export const UserProfileSchema = z.object({
  /** The user's full name. */
  name: z.string().min(1, 'El nombre es requerido.'),

  /** The user's unique email address, used for login. */
  email: z.string().email('El correo electrónico no es válido.'),

  /** The role of the user, which determines their permissions. */
  role: UserRoleSchema,

  /** A flag to indicate if the user's account is active or disabled. */
  isActive: z.boolean().default(true),

  /** The timestamp when the user account was created. */
  createdAt: z.custom<Timestamp>(),

  /** The UID of the user who created this account (typically a 'master' user). */
  createdBy: z.string().min(1, 'El creador es requerido.'),

  /** A flag to force the user to change their password on the next login. */
  mustChangePassword: z.boolean().default(false),
});

/**
 * TypeScript type representing a user profile document.
 * Includes an `id` field which corresponds to the Firestore document ID (user UID).
 */
export type UserProfile = z.infer<typeof UserProfileSchema> & {
  id: string;
};
