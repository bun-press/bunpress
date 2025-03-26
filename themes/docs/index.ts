/**
 * docs Theme
 * 
 * This file exports all components and layouts for the docs theme.
 */

// Layouts
import { HomeLayout } from './layouts/HomeLayout';
import { PageLayout } from './layouts/PageLayout';
import DocLayout from './layouts/DocLayout';

// Components
import { Navigation } from './components/Navigation';
import { TranslatedText } from './components/TranslatedText';
import { LanguageSelector } from './components/LanguageSelector';
import { Button } from './components/ui/button';
import { ScrollArea } from './components/ui/scroll-area';
import { Table } from './components/ui/table';
import { Input } from './components/ui/input';
import { Command } from './components/ui/command';
import { HoverCard } from './components/ui/hover-card';
import { DropdownMenu } from './components/ui/dropdown-menu';
import { Sheet } from './components/ui/sheet';
import { Select } from './components/ui/select';
import { Checkbox } from './components/ui/checkbox';
import { Separator } from './components/ui/separator';
import { Breadcrumb } from './components/ui/breadcrumb';
import { Alert } from './components/ui/alert';
import { Tabs } from './components/ui/tabs';
import { Popover } from './components/ui/popover';
import { NavigationMenu } from './components/ui/navigation-menu';
import { Accordion } from './components/ui/accordion';
import { Badge } from './components/ui/badge';
import { Dialog } from './components/ui/dialog';
import { Collapsible } from './components/ui/collapsible';
import { Card } from './components/ui/card';
import { Toggle } from './components/ui/toggle';
import { Progress } from './components/ui/progress';
import { Switch } from './components/ui/switch';
import { Tooltip } from './components/ui/tooltip';
import { Image } from './components/ui/image';
import { SearchDialog } from './components/SearchDialog';
import { Callout } from './components/custom/callout';
import { CodeBlock } from './components/custom/code-block';
import { Sidebar } from './components/Sidebar';
import { TOC } from './components/TOC';
import { Footer } from './components/Footer';

// Export layouts
export const layouts = {
  HomeLayout,
  PageLayout,
  DocLayout
};

// Export components
export const components = {
  Navigation,
  TranslatedText,
  LanguageSelector,
  Button,
  ScrollArea,
  Table,
  Input,
  Command,
  HoverCard,
  DropdownMenu,
  Sheet,
  Select,
  Checkbox,
  Separator,
  Breadcrumb,
  Alert,
  Tabs,
  Popover,
  NavigationMenu,
  Accordion,
  Badge,
  Dialog,
  Collapsible,
  Card,
  Toggle,
  Progress,
  Switch,
  Tooltip,
  Image,
  SearchDialog,
  Callout,
  CodeBlock,
  Sidebar,
  TOC,
  Footer
};

// Named exports
export { HomeLayout };
export { PageLayout };
export { DocLayout };
export { Navigation };
export { TranslatedText };
export { LanguageSelector };
export { Button };
export { ScrollArea };
export { Table };
export { Input };
export { Command };
export { HoverCard };
export { DropdownMenu };
export { Sheet };
export { Select };
export { Checkbox };
export { Separator };
export { Breadcrumb };
export { Alert };
export { Tabs };
export { Popover };
export { NavigationMenu };
export { Accordion };
export { Badge };
export { Dialog };
export { Collapsible };
export { Card };
export { Toggle };
export { Progress };
export { Switch };
export { Tooltip };
export { Image };
export { SearchDialog };
export { Callout };
export { CodeBlock };
export { Sidebar };
export { TOC };
export { Footer };

// Default export of all theme elements
export default {
  layouts,
  components
};
