import z from "zod"

export const loginBodySchema = z.object({
    email: z.string().nonempty("Email is required").email("Email format is not valid"),
    password: z.string().nonempty("Password is required"),
})


export type loginBodyType = z.infer<typeof loginBodySchema>
