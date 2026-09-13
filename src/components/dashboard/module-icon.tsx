import {
  LayoutDashboard, ShieldCheck, Bot, Lock, Filter, DoorOpen, DoorClosed,
  MailPlus, PenLine, Sparkles, Cake, Gift, Ticket, Activity, MessagesSquare,
  UserPlus, Image, Music, Mic, ScrollText, Brain, Settings2, Smile, Wrench,
  KeyRound, Sliders, CreditCard, Gauge, type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  LayoutDashboard, ShieldCheck, Bot, Lock, Filter, DoorOpen, DoorClosed,
  MailPlus, PenLine, Sparkles, Cake, Gift, Ticket, Activity, MessagesSquare,
  UserPlus, Image, Music, Mic, ScrollText, Brain, Settings2, Smile, Wrench,
  KeyRound, Sliders, CreditCard, Gauge,
};

export function ModuleIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}
