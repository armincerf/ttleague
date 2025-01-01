"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrCode, Users, UserCog, Trophy, ArrowUpDown } from "lucide-react";

const adminTools = [
  {
    title: "User Registration",
    description: "Generate QR codes for user registration",
    href: "/admin/user-registration",
    icon: QrCode,
  },
  {
    title: "User Management",
    description: "Manage user accounts and permissions",
    href: "/admin/user-management",
    icon: Users,
  },
  {
    title: "User Migration",
    description: "Migrate data between user accounts",
    href: "/admin/user-migration",
    icon: UserCog,
  },
  {
    title: "Leaderboard Sync",
    description: "Sync and manage leaderboard data",
    href: "/admin/leaderboard-sync",
    icon: Trophy,
  },
  {
    title: "Ranking System",
    description: "View and manage player rankings",
    href: "/admin/ranking-system",
    icon: ArrowUpDown,
  },
];

export function AdminTools() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Admin Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminTools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <tool.icon className="h-5 w-5" />
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{tool.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
} 