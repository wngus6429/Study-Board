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
            .min(8, "비밀번호는 8자 이상이어야 합니다.")
            .regex(
                /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/,
                "숫자+영문자+특수문자 조합으로 8자리 이상이어야 합니다."
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
