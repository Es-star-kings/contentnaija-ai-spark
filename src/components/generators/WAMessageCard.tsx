import { Button } from "@/components/ui/button";
import { Copy, Check, Star, Download, RefreshCcw, Share2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { exportPDF, downloadBlob } from "@/lib/exporters";

type Action = {
  onRegenerate?: () => void;
  onFavorite?: () => void;
  favorited?: boolean;
};

export function WAMessageCard({
  label,
  body,
  title,
  onRegenerate,
  onFavorite,
  favorited,
}: { label?: string; body: string; title: string } & Action) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Copied to clipboard");
  }

  function shareWA() {
    const url = `https://wa.me/?text=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label ? (
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">{label}</span>
        ) : <span />}
        <div className="flex flex-wrap items-center gap-1">
          <Button size="sm" variant="ghost" onClick={copy} title="Copy">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          {onFavorite && (
            <Button size="sm" variant="ghost" onClick={onFavorite} title="Favorite">
              <Star className={`h-3.5 w-3.5 ${favorited ? "fill-primary text-primary" : ""}`} />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => downloadBlob(body, `${title}.txt`, "text/plain")} title="Download TXT">
            <Save className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => exportPDF({ title, body })} title="Download PDF">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={shareWA} title="Share on WhatsApp">
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          {onRegenerate && (
            <Button size="sm" variant="ghost" onClick={onRegenerate} title="Regenerate">
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
    </div>
  );
}

export const WA_TONES = [
  "Formal", "Casual", "Luxury", "Friendly", "Youthful", "Corporate", "Humorous",
] as const;
