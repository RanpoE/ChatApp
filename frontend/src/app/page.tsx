"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useBackendStatus } from "@/lib/status";

export default function Home() {
  const router = useRouter();
  const ready = useAppSelector(s => s.auth.ready);
  const user = useAppSelector(s => s.auth.user);
  const { online } = useBackendStatus();

  useEffect(() => {
    if (!ready) return;
    if (!online) { router.replace("/login"); return; }
    router.replace(user ? "/chat" : "/login");
  }, [ready, user, online, router]);

  return null;
}
