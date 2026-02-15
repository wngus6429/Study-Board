import { z } from "zod";

export const storySchema = z.object({
    title: z
        .string()
        .min(3, "제목을 3글자 이상 입력해주세요."),
    content: z
        .string()
        .min(3, "내용을 3글자 이상 입력해주세요."),
    category: z.string().optional(),
});

export type StorySchema = z.infer<typeof storySchema>;
