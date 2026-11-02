import {
  Award, Calendar, Check, Clock, Dumbbell, Heart, Home, Leaf, MapPin, MessageCircle,
  PawPrint, Phone, Scale, Scissors, Shield, Sparkles, Star, Users, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  calendar: Calendar, clock: Clock, "map-pin": MapPin, phone: Phone,
  "message-circle": MessageCircle, scissors: Scissors, sparkles: Sparkles, star: Star,
  shield: Shield, users: Users, award: Award, heart: Heart, leaf: Leaf,
  "paw-print": PawPrint, scale: Scale, dumbbell: Dumbbell, home: Home, check: Check,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Star;
  return <C className={className} aria-hidden />;
}
