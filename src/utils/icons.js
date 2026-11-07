import {
  Feather, Mail, ScrollText, SpellCheck, Palette, Wand2, Shapes, Film, UserSquare, Scissors, Mic,
  Languages, AudioLines, Code2, GitPullRequest, Database, Megaphone, Search, Share2, Video,
  CalendarCheck, FileSearch, Bot, Headphones, Target, Telescope, PenLine, Image, Clapperboard,
  Zap, Sparkles, Building2, Cpu,
} from 'lucide-react';

const MAP = {
  Feather, Mail, ScrollText, SpellCheck, Palette, Wand2, Shapes, Film, UserSquare, Scissors, Mic,
  Languages, AudioLines, Code2, GitPullRequest, Database, Megaphone, Search, Share2, Video,
  CalendarCheck, FileSearch, Bot, Headphones, Target, Telescope, PenLine, Image, Clapperboard,
  Zap, Sparkles, Building2, Cpu,
};

export const getIcon = (name) => MAP[name] || Sparkles;
