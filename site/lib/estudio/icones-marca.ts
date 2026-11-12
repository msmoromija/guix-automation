import type { IconNode } from "lucide";
import {
  Activity,
  Aperture,
  Armchair,
  Award,
  BadgeCheck,
  BicepsFlexed,
  Bone,
  BookOpen,
  Briefcase,
  Brush,
  Calculator,
  Cat,
  Circle,
  Clock,
  Cross,
  Crown,
  Diamond,
  Dog,
  Droplet,
  Droplets,
  Dumbbell,
  Feather,
  FileText,
  Fish,
  Flame,
  Flower,
  Flower2,
  Gavel,
  Gem,
  HandHeart,
  Heart,
  Hexagon,
  Landmark,
  Leaf,
  Moon,
  Palette,
  PawPrint,
  Percent,
  Plus,
  Receipt,
  Scale,
  Scissors,
  ScissorsLineDashed,
  Shield,
  Shirt,
  Sparkle,
  Sparkles,
  SprayCan,
  Star,
  Stethoscope,
  Store,
  Sun,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  UserRound,
  Wallet,
  WandSparkles,
  Watch,
  Wind,
  Zap,
} from "lucide";

export type ItemIconeMarca = { id: string; nome: string; node: IconNode };

const todos: ItemIconeMarca[] = [
  { id: "Scissors", nome: "Tesoura", node: Scissors },
  { id: "ScissorsLineDashed", nome: "Tesoura fina", node: ScissorsLineDashed },
  { id: "SprayCan", nome: "Spray", node: SprayCan },
  { id: "Armchair", nome: "Cadeira", node: Armchair },
  { id: "Shirt", nome: "Camisa", node: Shirt },
  { id: "Crown", nome: "Coroa", node: Crown },
  { id: "Watch", nome: "Relógio", node: Watch },
  { id: "Flame", nome: "Chama", node: Flame },
  { id: "Sparkles", nome: "Brilho", node: Sparkles },
  { id: "Sparkle", nome: "Faísca", node: Sparkle },
  { id: "Star", nome: "Estrela", node: Star },
  { id: "Store", nome: "Loja", node: Store },
  { id: "UserRound", nome: "Pessoa", node: UserRound },
  { id: "WandSparkles", nome: "Varinha", node: WandSparkles },
  { id: "Brush", nome: "Pincel", node: Brush },
  { id: "Palette", nome: "Paleta", node: Palette },
  { id: "Wind", nome: "Vento", node: Wind },
  { id: "Flower2", nome: "Flor", node: Flower2 },
  { id: "Flower", nome: "Flor aberta", node: Flower },
  { id: "Heart", nome: "Coração", node: Heart },
  { id: "Gem", nome: "Gema", node: Gem },
  { id: "Sun", nome: "Sol", node: Sun },
  { id: "Moon", nome: "Lua", node: Moon },
  { id: "Droplets", nome: "Gotas", node: Droplets },
  { id: "Leaf", nome: "Folha", node: Leaf },
  { id: "Droplet", nome: "Gota", node: Droplet },
  { id: "Feather", nome: "Pena", node: Feather },
  { id: "HandHeart", nome: "Cuidado", node: HandHeart },
  { id: "PawPrint", nome: "Pata", node: PawPrint },
  { id: "Bone", nome: "Osso", node: Bone },
  { id: "Cat", nome: "Gato", node: Cat },
  { id: "Dog", nome: "Cão", node: Dog },
  { id: "Fish", nome: "Peixe", node: Fish },
  { id: "Dumbbell", nome: "Halter", node: Dumbbell },
  { id: "BicepsFlexed", nome: "Força", node: BicepsFlexed },
  { id: "Trophy", nome: "Troféu", node: Trophy },
  { id: "Timer", nome: "Timer", node: Timer },
  { id: "Target", nome: "Alvo", node: Target },
  { id: "Zap", nome: "Raio", node: Zap },
  { id: "Activity", nome: "Pulso", node: Activity },
  { id: "Award", nome: "Medalha", node: Award },
  { id: "Scale", nome: "Balança", node: Scale },
  { id: "Gavel", nome: "Martelo", node: Gavel },
  { id: "Landmark", nome: "Colunas", node: Landmark },
  { id: "BookOpen", nome: "Livro", node: BookOpen },
  { id: "Shield", nome: "Escudo", node: Shield },
  { id: "Briefcase", nome: "Pasta", node: Briefcase },
  { id: "Calculator", nome: "Calculadora", node: Calculator },
  { id: "FileText", nome: "Documento", node: FileText },
  { id: "Wallet", nome: "Carteira", node: Wallet },
  { id: "TrendingUp", nome: "Alta", node: TrendingUp },
  { id: "BadgeCheck", nome: "Selo", node: BadgeCheck },
  { id: "Receipt", nome: "Recibo", node: Receipt },
  { id: "Percent", nome: "Percentual", node: Percent },
  { id: "Stethoscope", nome: "Esteto", node: Stethoscope },
  { id: "Cross", nome: "Cruz", node: Cross },
  { id: "Plus", nome: "Mais", node: Plus },
  { id: "Clock", nome: "Hora", node: Clock },
  { id: "Hexagon", nome: "Hexágono", node: Hexagon },
  { id: "Diamond", nome: "Losango", node: Diamond },
  { id: "Circle", nome: "Círculo", node: Circle },
  { id: "Aperture", nome: "Abertura", node: Aperture },
];

const porId = new Map(todos.map((i) => [i.id, i]));

type FaixaNicho = { preferidos: string[]; extras: string[] };

const porNicho: Record<string, FaixaNicho> = {
  barbearia: {
    preferidos: ["Scissors", "ScissorsLineDashed", "SprayCan", "Armchair", "Shirt", "Crown", "Watch", "Flame"],
    extras: ["Sparkles", "UserRound", "Store", "Star"],
  },
  salao: {
    preferidos: ["Scissors", "WandSparkles", "Sparkles", "Brush", "Palette", "Flower2", "Wind", "Gem"],
    extras: ["Heart", "Flower", "Sun", "Droplets"],
  },
  estetica: {
    preferidos: ["Leaf", "Droplet", "Droplets", "Flower2", "Sparkles", "HandHeart", "Gem", "Feather"],
    extras: ["Heart", "Flower", "Sun", "Moon"],
  },
  petshop: {
    preferidos: ["PawPrint", "Bone", "Dog", "Cat", "Fish", "Heart", "Store", "Sparkle"],
    extras: ["Star", "HandHeart"],
  },
  academia: {
    preferidos: ["Dumbbell", "BicepsFlexed", "Trophy", "Timer", "Target", "Activity", "Zap", "Award"],
    extras: ["Flame", "Star"],
  },
  advocacia: {
    preferidos: ["Scale", "Gavel", "Landmark", "BookOpen", "Shield", "Briefcase", "Feather", "Award"],
    extras: ["FileText", "BadgeCheck"],
  },
  contabilidade: {
    preferidos: ["Calculator", "FileText", "Wallet", "TrendingUp", "Briefcase", "Receipt", "Percent", "BadgeCheck"],
    extras: ["Hexagon", "Circle"],
  },
  clinica: {
    preferidos: ["Stethoscope", "Heart", "Cross", "Plus", "HandHeart", "Leaf", "Shield", "Clock"],
    extras: ["Droplet", "UserRound"],
  },
  dentista: {
    preferidos: ["Sparkle", "Cross", "Shield", "Clock", "Heart", "HandHeart", "BadgeCheck", "UserRound"],
    extras: ["Leaf", "Star"],
  },
  psicologia: {
    preferidos: ["Heart", "HandHeart", "Leaf", "Feather", "Shield", "Clock", "Sparkles", "UserRound"],
    extras: ["Star", "BadgeCheck"],
  },
  nutricionista: {
    preferidos: ["Leaf", "Heart", "Sparkles", "Clock", "HandHeart", "BadgeCheck", "Store", "Droplet"],
    extras: ["Star", "Feather"],
  },
  generico: {
    preferidos: ["Sparkles", "Star", "Hexagon", "Diamond", "Award", "Aperture", "Circle", "Feather"],
    extras: ["Store", "Heart"],
  },
};

function faixa(nicho: string): FaixaNicho {
  return porNicho[nicho] || porNicho.generico;
}

function resolver(ids: string[]): ItemIconeMarca[] {
  return ids.map((id) => porId.get(id)).filter((i): i is ItemIconeMarca => Boolean(i));
}

export const ROTULO_NICHO: Record<string, string> = {
  barbearia: "barbearia",
  salao: "salão",
  estetica: "estética",
  petshop: "pet shop",
  academia: "academia",
  advocacia: "advocacia",
  contabilidade: "contabilidade",
  clinica: "clínica",
  dentista: "dentista",
  psicologia: "psicologia",
  nutricionista: "nutricionista",
  generico: "negócio",
};

export function bibliotecaIcones(): ItemIconeMarca[] {
  return todos;
}

/** Ícones do ofício — o que o cliente vê no modo simples e a IA pode escolher. */
export function iconesDoNicho(nicho: string): ItemIconeMarca[] {
  return resolver(faixa(nicho).preferidos);
}

/** Preferidos + uns poucos extras ainda do mesmo ofício. Nunca o catálogo inteiro. */
export function iconesAvancadoDoNicho(nicho: string): ItemIconeMarca[] {
  const f = faixa(nicho);
  return resolver([...f.preferidos, ...f.extras]);
}

export function iconePorId(id: string): ItemIconeMarca | undefined {
  return porId.get(id);
}

export function idsIconesDoNicho(nicho: string): string[] {
  return iconesAvancadoDoNicho(nicho).map((i) => i.id);
}

export function idsIconesPermitidos(): string[] {
  return todos.map((i) => i.id);
}

function attrsXml(attrs: Record<string, string | number | undefined>) {
  return Object.entries(attrs)
    .filter(([k, v]) => k !== "key" && v !== undefined)
    .map(([k, v]) => `${k}="${String(v)}"`)
    .join(" ");
}

export function innerIcone(id: string): string {
  const item = porId.get(id) || porId.get("Scissors")!;
  return item.node.map(([tag, attrs]) => `<${tag} ${attrsXml(attrs)}/>`).join("");
}

export function svgIcone(id: string, cor: string, size = 24) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${innerIcone(id)}</svg>`;
}
