import z from "zod";

// SHARED
export const registerBodySchema = z.object({
  firstName: z
    .string()
    .nonempty("First name is required")
    .min(3, "Name cannot be less than 3 characters"),
  email: z
    .string()
    .nonempty("Email is required")
    .email("Email format is not valid"),
  password: z.string().nonempty("Password is required"),
  confirmPassword: z.string().nonempty("Confirmation is required"),
  referralCode: z.string().trim().optional(),
});

export type registerBodyType = z.infer<typeof registerBodySchema>;
