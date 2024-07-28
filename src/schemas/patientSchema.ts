import { z } from 'zod';

const nameRegex = /^[a-zA-Z-'. ]+$/; // Allow letters, hyphens, apostrophes, periods, and spaces
const phoneRegex = /^\+?[0-9()\-.\s]{7,15}$/; // Allow optional leading +, digits, hyphens, parentheses, periods, and spaces. Length between 7 to 15 characters.

const patientSchema = z.object({
    givenName: z.string().min(1, 'Given name is required')
                          .max(50, 'Given name must be less than 50 characters')
                          .regex(nameRegex, 'Given name contains invalid characters'),
    familyName: z.string().min(1, 'Family name is required')
                          .max(50, 'Family name must be less than 50 characters')
                          .regex(nameRegex, 'Family name contains invalid characters'),
    gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
    birthDate: z.string().refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      return birthDate < today && (today.getFullYear() - birthDate.getFullYear()) <= 120;
    }, { message: 'Invalid date of birth' }),
    phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    address: z.object({
      line1: z.string().min(1, 'Address line is required').optional().or(z.literal('')),
      city: z.string().min(1, 'City is required').optional().or(z.literal('')),
      state: z.string().min(1, 'State is required').optional().or(z.literal('')),
      postalCode: z.string().min(1, 'Postal code is required').optional().or(z.literal('')),
    }),
  });

export default patientSchema;