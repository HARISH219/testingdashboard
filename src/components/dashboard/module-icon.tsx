import {
  LayoutDashboard, ShieldCheck, Bot, Lock, Filter, DoorOpen, DoorClosed,
  MailPlus, PenLine, Sparkles, Cake, Gift, Ticket, Activity, MessagesSquare,
  UserPlus, Image, Mic, ScrollText, Settings2, Wrench,
  KeyRound, Sliders, CreditCard, Gauge, Moon, Eye, UserCog,
  Users, Hash, BarChart3, BotMessageSquare, type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  LayoutDashboard, ShieldCheck, Bot, Lock, Filter, DoorOpen, DoorClosed,
  MailPlus, PenLine, Sparkles, Cake, Gift, Ticket, Activity, MessagesSquare,
  UserPlus, Image, Mic, ScrollText, Settings2, Wrench,
  KeyRound, Sliders, CreditCard, Gauge, Moon, Eye, UserCog,
  Users, Hash, BarChart3, BotMessageSquare,
};

export function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}
