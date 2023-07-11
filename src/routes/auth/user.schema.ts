import { z } from 'zod'

const userSchema = z.object({
  first_name: z.string().min(2, 'Слишком короткое имя'),
  last_name: z.string().min(2, 'Слишком короткая фамилия'),
  email: z.string().email('Некорректный адрес электронной почты'),
  contact_number: z.string().min(10, 'Некорректный номер телефона'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Некорректный формат даты рождения'),
  password: z
    .string()
    .min(8, 'Слишком короткий пароль')
    .regex(/.*[A-Z].*/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/^(?=.*\d).*$/, 'Пароль должен содержать как минимум одну цифру'),
})

export { userSchema }
