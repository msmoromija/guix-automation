import {
  Calendar, Clock, MapPin, Phone, MessageCircle, Scissors, Sparkles, Star, Shield,
  Users, Award, Heart, Leaf, PawPrint, Scale, Dumbbell, Home, Check, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  calendar: Calendar,
  clock: Clock,
  "map-pin": MapPin,
  phone: Phone,
  "message-circle": MessageCircle,
  scissors: Scissors,
  sparkles: Sparkles,
  star: Star,
  shield: Shield,
  users: Users,
  award: Award,
  heart: Heart,
  leaf: Leaf,
  "paw-print": PawPrint,
  scale: Scale,
  dumbbell: Dumbbell,
  home: Home,
  check: Check,
};

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Star;
}
