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
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>

        {/* Status Badge */}
        <div className="mt-2 flex items-center gap-2">
          {isChecking ? (
            <Badge variant="secondary" className="text-xs">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Checking...
            </Badge>
          ) : isDesktopApp ? (
            isClaudeInstalled ? (
              <Badge variant="default" className="text-xs bg-green-600">
                <Terminal className="h-3 w-3 mr-1" />
                Claude CLI Ready
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Claude CLI Not Found
              </Badge>
            )
          ) : (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Web API Mode
            </Badge>
          )}
        </div>

        {selectedPath && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs font-mono">
              {pathToString(selectedPath)}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
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
          <Card className="p-3 mb-4 bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Selected Value:</p>
            <pre className="text-sm overflow-auto max-h-32">
              {typeof selectedValue === 'object'
                ? JSON.stringify(selectedValue, null, 2)
                : String(selectedValue)}
            </pre>
          </Card>
        )}

        {/* Quick actions */}
        {selectedPath && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Quick Actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setInput(action.label)}
                  disabled={isDesktopApp && !isClaudeInstalled}
                >
                  <action.icon className="h-3 w-3 mr-1" />
                  {action.label}
                </Button>
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
          <div className="text-center text-muted-foreground py-8">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a field in the tree to use AI</p>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder={
              !selectedPath
                ? 'Select a field first...'
                : isDesktopApp && !isClaudeInstalled
                ? 'Install Claude CLI first...'
                : 'Describe what you want to change...'
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
            className="min-h-[60px] resize-none"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={
              !selectedPath ||
              !input.trim() ||
              isAILoading ||
              (isDesktopApp && !isClaudeInstalled)
            }
          >
            {isAILoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {isDesktopApp && isClaudeInstalled && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Terminal className="h-3 w-3" />
            Using local Claude CLI (no API key needed)
          </p>
        )}
      </div>
    </div>
  );
}
