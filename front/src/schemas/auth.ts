import { z } from "zod";

export const signupSchema = z
    .object({
        email: z
            .string()
            .min(1, "이메일을 입력해주세요.")
            .email("유효한 이메일 형식이 아닙니다."),
        nickname: z
            .string()
            .min(1, "닉네임을 입력해주세요.")
            .max(20, "닉네임은 20자 이하여야 합니다."),
        password: z
            .string()
            .min(4, "비밀번호는 4자 이상이어야 합니다.")
            .max(20, "비밀번호는 20자 이하여야 합니다.")
            .regex(
                /^[A-Za-z0-9]*$/,
                "비밀번호는 영문자와 숫자만 사용할 수 있습니다."
            ),
        rePassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
        terms: z.boolean().refine((val) => val === true, {
            message: "약관에 동의해주세요.",
        }),
    })
    .refine((data) => data.password === data.rePassword, {
        path: ["rePassword"],
        message: "비밀번호가 일치하지 않습니다.",
    });

export type SignupSchema = z.infer<typeof signupSchema>;
