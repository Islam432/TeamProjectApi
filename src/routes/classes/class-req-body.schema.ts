import z from 'zod'

export const ClassReqBodySchema = z.object({
  description: z.string().optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  open_for_enrollment: z.boolean().optional(),
  course_code: z.string().optional(),
  branch_id: z.number().optional(),
  course_id: z.number().optional(),
})

