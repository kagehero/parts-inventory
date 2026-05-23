"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MotionFade } from "@/components/motion-fade";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <MotionFade className="w-full max-w-md">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">部品在庫・業務管理</CardTitle>
            <CardDescription>ログインして続行してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                startTransition(async () => {
                  const result = await signIn("credentials", {
                    redirect: false,
                    email,
                    password,
                    callbackUrl,
                  });
                  if (result?.error) {
                    setError("メールアドレスまたはパスワードが正しくありません。");
                    return;
                  }
                  router.push(callbackUrl);
                  router.refresh();
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">
                  メール
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  パスワード
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "送信中..." : "ログイン"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </MotionFade>
    </div>
  );
}
