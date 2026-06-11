import AuthGuard from "@/app/components/Provider/AuthGuard";

export default function AfterLoginLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
