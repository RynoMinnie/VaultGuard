'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Copy, Check, RefreshCw, Shuffle } from 'lucide-react';
import { generatePassword } from '@/lib/crypto';
import { toast } from 'sonner';

interface PasswordGeneratorProps {
  value: string;
  onChange: (password: string) => void;
}

export function PasswordGenerator({ value, onChange }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const pw = generatePassword({ length, uppercase, lowercase, numbers, symbols });
    onChange(pw);
    return pw;
  }, [length, uppercase, lowercase, numbers, symbols, onChange]);

  const copyToClipboard = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Shuffle className="h-4 w-4" />
          Password Generator
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const pw = generate();
            if (pw) copyToClipboard();
          }}
          className="h-7 text-xs"
        >
          Generate & Copy
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Click generate or type..."
            className="font-mono text-sm pr-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={generate}
          className="shrink-0"
          title="Generate password"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="shrink-0"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Length: {length}</Label>
        </div>
        <Slider
          value={[length]}
          onValueChange={([v]) => setLength(v)}
          min={8}
          max={64}
          step={1}
          className="w-full"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={uppercase} onCheckedChange={setUppercase} />
            <span className="text-xs text-muted-foreground">Uppercase (A-Z)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={lowercase} onCheckedChange={setLowercase} />
            <span className="text-xs text-muted-foreground">Lowercase (a-z)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={numbers} onCheckedChange={setNumbers} />
            <span className="text-xs text-muted-foreground">Numbers (0-9)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={symbols} onCheckedChange={setSymbols} />
            <span className="text-xs text-muted-foreground">Symbols (!@#$)</span>
          </label>
        </div>
      </div>
    </div>
  );
}