import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  Clock,
  Code,
  Compass,
  ExternalLink,
  Globe,
  Heart,
  Layers,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Palette,
  Phone,
  Rocket,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
}

export const AVAILABLE_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'sparkles', label: 'Tỏa sáng (Sparkles)' },
  { value: 'zap', label: 'Tốc độ (Zap)' },
  { value: 'shield', label: 'Bảo đảm (Shield)' },
  { value: 'rocket', label: 'Tăng trưởng (Rocket)' },
  { value: 'layers', label: 'Cấu trúc (Layers)' },
  { value: 'heart', label: 'Tận tâm (Heart)' },
  { value: 'award', label: 'Thành tích (Award)' },
  { value: 'compass', label: 'Định hướng (Compass)' },
  { value: 'code', label: 'Kỹ thuật (Code)' },
  { value: 'shopping-bag', label: 'Bán hàng (Bag)' },
  { value: 'clock', label: 'Nhanh chóng (Clock)' },
  { value: 'star', label: 'Nổi bật (Star)' },
  { value: 'users', label: 'Cộng đồng (Users)' },
  { value: 'globe', label: 'Toàn cầu (Globe)' },
  { value: 'palette', label: 'Thiết kế (Palette)' },
  { value: 'briefcase', label: 'Chuyên nghiệp (Briefcase)' },
  { value: 'book-open', label: 'Tài liệu (Book)' },
  { value: 'message-circle', label: 'Tư vấn (Chat)' },
];

export function IconRenderer({ name, size = 20, className }: IconRendererProps) {
  switch (name) {
    case 'sparkles':
      return <Sparkles size={size} className={className} />;
    case 'zap':
      return <Zap size={size} className={className} />;
    case 'shield':
      return <Shield size={size} className={className} />;
    case 'rocket':
      return <Rocket size={size} className={className} />;
    case 'layers':
      return <Layers size={size} className={className} />;
    case 'heart':
      return <Heart size={size} className={className} />;
    case 'award':
      return <Award size={size} className={className} />;
    case 'check':
      return <Check size={size} className={className} />;
    case 'compass':
      return <Compass size={size} className={className} />;
    case 'code':
      return <Code size={size} className={className} />;
    case 'shopping-bag':
      return <ShoppingBag size={size} className={className} />;
    case 'clock':
      return <Clock size={size} className={className} />;
    case 'star':
      return <Star size={size} className={className} />;
    case 'users':
      return <Users size={size} className={className} />;
    case 'globe':
      return <Globe size={size} className={className} />;
    case 'palette':
      return <Palette size={size} className={className} />;
    case 'briefcase':
      return <Briefcase size={size} className={className} />;
    case 'book-open':
      return <BookOpen size={size} className={className} />;
    case 'message-circle':
      return <MessageCircle size={size} className={className} />;
    case 'phone':
      return <Phone size={size} className={className} />;
    case 'mail':
      return <Mail size={size} className={className} />;
    case 'map-pin':
      return <MapPin size={size} className={className} />;
    case 'external-link':
      return <ExternalLink size={size} className={className} />;
    case 'arrow-right':
      return <ArrowRight size={size} className={className} />;
    case 'chevron-down':
      return <ChevronDown size={size} className={className} />;
    case 'menu':
      return <Menu size={size} className={className} />;
    case 'x':
      return <X size={size} className={className} />;
    default:
      if (/[^\x00-\x7F]/.test(name)) {
        return <span className={className} style={{ fontSize: size, lineHeight: 1 }}>{name}</span>;
      }
      return <Sparkles size={size} className={className} />;
  }
}
