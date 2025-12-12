'use client';

import { useState, useEffect } from 'react';
import { usePromptStore } from '@/lib/store/promptStore';
import { getValueAtPath, pathToString } from '@/lib/json/updater';
import { useTauri } from '@/hooks/useTauri';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  Send,
  Loader2,
  Check,
  X,
  Lightbulb,
  Wand2,
  Terminal,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { JsonValue } from '@/types/prompt';

interface AISuggestion {
  originalValue: JsonValue;
  suggestedValue: JsonValue;
  explanation: string;
}

export function AIPanel() {
  const {
    getCurrentPrompt,
    selectedPath,
    updateValue,
    isAILoading,
    setAILoading,
    aiError,
    setAIError,
  } = usePromptStore();

  const { isDesktopApp, isClaudeInstalled, isChecking, aiUpdateValue } = useTauri();

  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);

  const prompt = getCurrentPrompt();
  const selectedValue = prompt && selectedPath
    ? getValueAtPath(prompt.content, selectedPath)
    : null;

  // Web API ile çağrı (fallback)
  const callWebAPI = async () => {
    const response = await fetch('/api/ai/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userRequest: input,
        currentPath: selectedPath,
        currentValue: selectedValue,
        fullPrompt: prompt?.content,
      }),
    });

    if (!response.ok) {
      throw new Error('AI request failed');
    }

    return response.json();
  };

  // Tauri CLI ile çağrı
  const callTauriCLI = async () => {
    const response = await aiUpdateValue({
      user_request: input,
      current_path: selectedPath || undefined,
      current_value: selectedValue,
      full_prompt: prompt?.content,
    });

    if (!response.success) {
      throw new Error(response.error || 'Claude CLI error');
    }

    // Parse the output
    const outputText = response.output || '';
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  };

  const handleSubmit = async () => {
    if (!input.trim() || !prompt) return;

    setAILoading(true);
    setAIError(null);
    setSuggestion(null);

    try {
      let data;

      // Tauri app ise CLI kullan, değilse web API
      if (isDesktopApp && isClaudeInstalled) {
        data = await callTauriCLI();
      } else {
        data = await callWebAPI();
      }

      if (data.success) {
        setSuggestion({
          originalValue: selectedValue ?? null,
          suggestedValue: data.updatedValue,
          explanation: data.explanation,
        });
      } else {
        setAIError(data.error || 'Unknown error');
      }
    } catch (error) {
      setAIError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setAILoading(false);
    }
  };

  const handleApplySuggestion = () => {
    if (suggestion && selectedPath) {
      updateValue(selectedPath, suggestion.suggestedValue);
      setSuggestion(null);
      setInput('');
    }
  };

  const handleRejectSuggestion = () => {
    setSuggestion(null);
  };

  const quickActions = [
    { label: 'Daha detaylı yap', icon: Wand2 },
    { label: 'Basitleştir', icon: Lightbulb },
    { label: 'Türkçeye çevir', icon: Sparkles },
  ];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-12 px-3 border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI</span>
        </div>

        {/* Status Badge */}
        {isChecking ? (
          <Badge variant="secondary" className="text-xs h-6">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ...
          </Badge>
        ) : isDesktopApp ? (
          isClaudeInstalled ? (
            <Badge className="text-xs h-6 bg-green-600 hover:bg-green-600">
              <Check className="h-3 w-3 mr-1" />
              Hazır
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs h-6">
              <X className="h-3 w-3 mr-1" />
              CLI Yok
            </Badge>
          )
        ) : (
          <Badge variant="secondary" className="text-xs h-6">
            API
          </Badge>
        )}
      </div>

      {/* Selected Path */}
      {selectedPath && (
        <div className="px-3 py-2 border-b bg-muted/50">
          <code className="text-xs text-muted-foreground truncate block">
            {pathToString(selectedPath)}
          </code>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Desktop app but no Claude CLI */}
        {isDesktopApp && !isClaudeInstalled && !isChecking && (
          <Card className="p-4 mb-4 border-yellow-500/50 bg-yellow-500/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Claude CLI not found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Install Claude CLI to use AI features:
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">
                  npm install -g @anthropic-ai/claude-code
                </code>
              </div>
            </div>
          </Card>
        )}

        {/* Selected value preview */}
        {selectedPath && selectedValue !== undefined && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Seçili Değer</p>
            <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                {typeof selectedValue === 'object'
                  ? JSON.stringify(selectedValue, null, 2)
                  : String(selectedValue)}
              </pre>
            </div>
          </div>
        )}

        {/* Quick actions */}
        {selectedPath && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Hızlı İşlemler</p>
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => setInput(action.label)}
                  disabled={isDesktopApp && !isClaudeInstalled}
                >
                  <action.icon className="h-3 w-3" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestion */}
        {suggestion && (
          <Card className="p-4 mb-4 border-primary/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium text-sm">AI Suggestion</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {suggestion.explanation}
            </p>
            <div className="bg-muted rounded-md p-2 mb-3">
              <pre className="text-xs overflow-auto max-h-40">
                {typeof suggestion.suggestedValue === 'object'
                  ? JSON.stringify(suggestion.suggestedValue, null, 2)
                  : String(suggestion.suggestedValue)}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleApplySuggestion}>
                <Check className="h-4 w-4 mr-1" />
                Apply
              </Button>
              <Button size="sm" variant="outline" onClick={handleRejectSuggestion}>
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </Card>
        )}

        {/* Error */}
        {aiError && (
          <Card className="p-3 mb-4 border-destructive/50 bg-destructive/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{aiError}</p>
            </div>
          </Card>
        )}

        {/* No selection message */}
        {!selectedPath && (
          <div className="text-center text-muted-foreground py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 opacity-50" />
            </div>
            <p className="text-sm font-medium mb-1">Bir alan seç</p>
            <p className="text-xs">Soldaki ağaçtan bir alana tıkla</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-muted/20">
        <div className="relative">
          <Textarea
            placeholder={
              !selectedPath
                ? 'Önce bir alan seç...'
                : isDesktopApp && !isClaudeInstalled
                ? 'Önce Claude CLI kur...'
                : 'Ne değiştirmek istiyorsun?'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={!selectedPath || isAILoading || (isDesktopApp && !isClaudeInstalled)}
            className="min-h-[80px] resize-none pr-12 text-sm"
          />
          <button
            onClick={handleSubmit}
            disabled={
              !selectedPath ||
              !input.trim() ||
              isAILoading ||
              (isDesktopApp && !isClaudeInstalled)
            }
            className="absolute right-2 bottom-2 h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {isAILoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        {isDesktopApp && isClaudeInstalled && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Terminal className="h-3 w-3" />
            Lokal Claude CLI kullanılıyor
          </p>
        )}
      </div>
    </div>
  );
}
