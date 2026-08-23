"use client";

import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { TopNavbar, Navbar } from "@/components/layout/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

interface ComingLaterProps {
  title: string;
  description: string;
}

export default function ComingLater({ title, description }: ComingLaterProps) {
  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopNavbar
        title={title}
        subtitle="Coming later"
        showNotifications={false}
        showThemeToggle={true}
        showMeeting={false}
      />

      <main className="container mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-10">
        <Card className="w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-bg-elevated">
              <Clock className="h-6 w-6 text-cta-start" />
            </div>
            <CardTitle>{title} Is Parked For Now</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard"
              className="btn-cta inline-flex min-h-[44px] items-center justify-center gap-2 px-4 py-3 font-medium transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to MVP dashboard
            </Link>
          </CardContent>
        </Card>
      </main>

      <Navbar />
    </div>
  );
}
