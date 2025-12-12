'use client';

import { useState, useEffect } from 'react';
import { usePromptStore } from '@/lib/store/promptStore';
import { PromptTree } from '@/components/editor/PromptTree';
import { AIPanel } from '@/components/ai/AIPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  FileJson,
  Trash2,
  Edit,
  Sparkles,
  Upload,
  ChevronLeft,
  Download,
  Apple,
  Monitor,
  Check,
  Zap,
  Eye,
  MessageSquare,
  Github,
  Terminal,
  Loader2,
} from 'lucide-react';

// GitHub releases URL - bunu sonra güncelleyeceksin
const GITHUB_RELEASES = 'https://github.com/anthropics/prompto/releases/latest';
const MAC_DOWNLOAD = 'https://github.com/anthropics/prompto/releases/download/v0.1.0/Prompto_0.1.0_aarch64.dmg';
const WINDOWS_DOWNLOAD = 'https://github.com/anthropics/prompto/releases/download/v0.1.0/Prompto_0.1.0_x64-setup.exe';

type View = 'dashboard' | 'editor';
type AppMode = 'loading' | 'desktop' | 'web';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('loading');

  // Tauri kontrolü
  useEffect(() => {
    const checkEnvironment = async () => {
      // Kısa bir delay ile kontrol (hydration için)
      await new Promise(r => setTimeout(r, 100));

      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        setAppMode('desktop');
      } else {
        setAppMode('web');
      }
    };

    checkEnvironment();
  }, []);

  // Loading state
  if (appMode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Web mode → Landing Page
  if (appMode === 'web') {
    return <LandingPage />;
  }

  // Desktop mode → Editor App
  return <EditorApp />;
}

// ============================================
// LANDING PAGE (Web için)
// ============================================
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Sparkles className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold">Prompto</h1>
        </div>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
          AI-Powered Prompt Editor
        </p>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-12">
          Karmaşık AI prompt'larını görselleştir, düzenle ve
          <span className="text-primary font-semibold"> Claude CLI </span>
          ile doğrudan optimize et. API key gerekmez!
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button size="lg" className="gap-2 text-lg px-8 py-6" asChild>
            <a href={MAC_DOWNLOAD}>
              <Apple className="h-6 w-6" />
              Download for Mac
            </a>
          </Button>

          <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6" asChild>
            <a href={WINDOWS_DOWNLOAD}>
              <Monitor className="h-6 w-6" />
              Download for Windows
            </a>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          v0.1.0 • macOS 11+ / Windows 10+ • Sadece 4.4MB
        </p>
      </section>

      {/* Requirement Banner */}
      <section className="container mx-auto px-4 py-8">
        <Card className="p-6 bg-primary/5 border-primary/20 max-w-2xl mx-auto">
          <div className="flex items-start gap-4">
            <Terminal className="h-8 w-8 text-primary mt-1" />
            <div className="text-left">
              <h3 className="font-semibold text-lg mb-2">Claude CLI Gerekli</h3>
              <p className="text-muted-foreground mb-3">
                Prompto, Claude Max/Pro planınızı kullanır. Önce Claude CLI'ı yükleyin:
              </p>
              <code className="bg-muted px-3 py-2 rounded text-sm block">
                npm install -g @anthropic-ai/claude-code
              </code>
            </div>
          </div>
        </Card>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Özellikler</h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="p-6 text-center">
            <Eye className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Görsel Tree View</h3>
            <p className="text-muted-foreground">
              JSON prompt'larını ağaç yapısında gör. Nested objeler, array'ler hepsi düzenli.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Inline Editing</h3>
            <p className="text-muted-foreground">
              Tıkla ve düzenle. String, boolean, number - her tip için özel editor.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <MessageSquare className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">AI Destekli</h3>
            <p className="text-muted-foreground">
              "Bunu daha detaylı yap" de, Claude anında güncellesin. Doğal dil ile düzenleme.
            </p>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16 bg-muted/50">
        <h2 className="text-3xl font-bold text-center mb-12">Nasıl Çalışır?</h2>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</div>
            <div>
              <h3 className="font-semibold">Claude CLI'ı Yükle</h3>
              <p className="text-muted-foreground">Claude Max veya Pro planın varsa CLI'ı yükle</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</div>
            <div>
              <h3 className="font-semibold">Prompto'yu İndir</h3>
              <p className="text-muted-foreground">Mac veya Windows için indir ve çalıştır</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</div>
            <div>
              <h3 className="font-semibold">Prompt'larını Düzenle</h3>
              <p className="text-muted-foreground">JSON yapıştır veya sıfırdan oluştur, AI ile optimize et</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Neden Prompto?</h2>

        <div className="max-w-2xl mx-auto space-y-4">
          {[
            'API key gerekmez - Claude CLI kullanır',
            'Tamamen ücretsiz ve açık kaynak',
            'Offline çalışır (Claude CLI ile)',
            'Çok hafif - sadece 4.4MB',
            'Mac ve Windows desteği',
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Hemen Başla</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="gap-2" asChild>
            <a href={MAC_DOWNLOAD}>
              <Download className="h-5 w-5" />
              Download for Mac
            </a>
          </Button>
          <Button size="lg" variant="outline" className="gap-2" asChild>
            <a href={WINDOWS_DOWNLOAD}>
              <Download className="h-5 w-5" />
              Download for Windows
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">Prompto</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/anthropics/prompto"
              className="text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            Built with Tauri + Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================
// EDITOR APP (Tauri Desktop için)
// ============================================
function EditorApp() {
  const {
    prompts,
    currentPromptId,
    createPrompt,
    deletePrompt,
    setCurrentPrompt,
    getCurrentPrompt,
  } = usePromptStore();

  const [view, setView] = useState<View>(currentPromptId ? 'editor' : 'dashboard');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [importJson, setImportJson] = useState('');

  const prompt = getCurrentPrompt();

  const handleCreate = () => {
    if (!newName.trim()) return;

    let content = {};
    if (importJson.trim()) {
      try {
        content = JSON.parse(importJson);
      } catch {
        alert('Invalid JSON format');
        return;
      }
    }

    const id = createPrompt(newName.trim(), content);
    setNewName('');
    setImportJson('');
    setShowCreate(false);
    setCurrentPrompt(id);
    setView('editor');
  };

  const handleOpen = (id: string) => {
    setCurrentPrompt(id);
    setView('editor');
  };

  const handleBack = () => {
    setCurrentPrompt(null);
    setView('dashboard');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      deletePrompt(id);
    }
  };

  // Sample prompt for demo
  const samplePrompt = {
    image_generation: {
      requirements: {
        face_preservation: {
          preserve_original: true,
          accuracy_level: "100% identical to reference",
          details: [
            "real facial proportions",
            "exact skin texture",
            "true eye shape and color",
          ],
        },
        pose: {
          match_reference_pose: true,
          description: "Chest-up portrait, face forward",
        },
        lighting: {
          type: "soft diffused indoor lighting",
          direction: "front-left",
          shadows: "gentle soft shadows",
        },
      },
      subject: {
        gender: "male",
        age: "child",
        expression: "neutral, slightly curious",
        clothing: {
          top: "Avengers-style suit top",
          accessory: "miniature Avengers emblem",
        },
      },
      composition: {
        frame: "chest-up portrait",
        style: "hyper-realistic with split real/comic effect",
      },
    },
  };

  const handleCreateSample = () => {
    const id = createPrompt('Sample Image Prompt', samplePrompt);
    setCurrentPrompt(id);
    setView('editor');
  };

  // EDITOR VIEW
  if (view === 'editor' && prompt) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-lg">{prompt.name}</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Tree View */}
          <div className="w-[400px] border-r flex flex-col">
            <PromptTree />
          </div>

          {/* Center Panel - Raw JSON View */}
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="preview" className="flex-1 flex flex-col">
              <div className="border-b px-4">
                <TabsList className="h-10">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="preview" className="flex-1 m-0 p-4 overflow-auto">
                <Card className="p-4">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(prompt.content, null, 2)}
                  </pre>
                </Card>
              </TabsContent>
              <TabsContent value="raw" className="flex-1 m-0 p-4 overflow-auto">
                <ScrollArea className="h-full">
                  <pre className="text-sm font-mono p-4 bg-muted rounded-lg">
                    {JSON.stringify(prompt.content, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - AI */}
          <div className="w-[350px]">
            <AIPanel />
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="font-semibold text-lg">Prompto</h1>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Prompto
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-Powered Prompt Editor
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Prompt
          </Button>
        </div>

        {/* Create dialog */}
        {showCreate && (
          <Card className="p-6 mb-8">
            <h2 className="font-semibold mb-4">Create New Prompt</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <Input
                  placeholder="My Awesome Prompt"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">
                  Import JSON (optional)
                </label>
                <Textarea
                  placeholder='{"key": "value"}'
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate}>Create</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Prompts list */}
        {prompts.length === 0 ? (
          <Card className="p-12 text-center">
            <FileJson className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No prompts yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first prompt or try a sample
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </Button>
              <Button variant="outline" onClick={handleCreateSample}>
                <Upload className="h-4 w-4 mr-2" />
                Load Sample
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prompts.map((p) => (
              <Card
                key={p.id}
                className="p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleOpen(p.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">{p.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen(p.id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(e, p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {Object.keys(p.content).length} root keys
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated: {new Date(p.updatedAt).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
