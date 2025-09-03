"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export default function Home() {
  const router = useRouter();
  const ready = useAppSelector(s => s.auth.ready);
  const user = useAppSelector(s => s.auth.user);

  useEffect(() => {
    if (!ready) return;
    router.replace(user ? "/chat" : "/login");
  }, [ready, user, router]);

  return null;
}
