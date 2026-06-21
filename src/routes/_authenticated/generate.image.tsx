import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateImage, type ImageOutput } from "@/lib/generators.functions";
import { Wand2, Loader2, Download, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { GeneratorShell, GeneratorEmpty, GeneratorSkeleton } from "@/components/generators/GeneratorShell";

export const Route = createFileRoute("/_authenticated/generate/image")({
  head: () => ({ meta: [{ title: "AI Image Generator — ContentNaija AI" }] }),
  component: ImageGen,
});

type Result = ImageOutput & { remaining: number | null };

function ImageGen() {
  const fn = useServerFn(generateImage);
  const qc = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Vibrant marketing photo");
  const [purpose, setPurpose] = useState<"flyer" | "social" | "product" | "logo">("social");
  const [aspect, setAspect] = useState<"1024x1024" | "1024x1536" | "1536x1024">("1024x1024");
  const [result, setResult] = useState<Result | null>(null);

  const mutation = useMutation({
    mutationFn: () => fn({ data: { prompt, style, purpose, aspect } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Image ready!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to generate"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return toast.error("Describe the image you want.");
    mutation.mutate();
  }

  async function download() {
    if (!result) return;
    try {
      const res = await fetch(result.url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `contentnaija-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("Download failed.");
    }
  }

  const form = (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="prompt">What should the image show?</Label>
        <Textarea
          id="prompt"
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A jollof rice plate steaming on a wooden table with ankara cloth in the background"
        />
      </div>

      <div>
        <Label htmlFor="style">Style</Label>
        <Input
          id="style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="Vibrant marketing photo / minimal flat / cinematic"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Purpose</Label>
          <Select value={purpose} onValueChange={(v) => setPurpose(v as typeof purpose)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="social">Social post</SelectItem>
              <SelectItem value="flyer">Flyer / poster</SelectItem>
              <SelectItem value="product">Product shot</SelectItem>
              <SelectItem value="logo">Logo / icon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Aspect</Label>
          <Select value={aspect} onValueChange={(v) => setAspect(v as typeof aspect)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1024x1024">Square 1:1</SelectItem>
              <SelectItem value="1024x1536">Portrait 2:3</SelectItem>
              <SelectItem value="1536x1024">Landscape 3:2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating image (15-30s)…</>
        ) : (
          <><Wand2 className="mr-2 h-4 w-4" /> Generate image</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Image generation costs more credits than text. Avoid copyrighted characters or real people.
      </p>
    </form>
  );

  const output = mutation.isPending ? (
    <GeneratorSkeleton count={1} />
  ) : result ? (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <img src={result.url} alt={prompt} className="w-full" />
      </div>
      <div className="flex gap-2">
        <Button onClick={download} variant="default" className="flex-1">
          <Download className="mr-2 h-4 w-4" /> Download PNG
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Signed URL valid for 7 days. Re-open from History to refresh access.
      </p>
    </div>
  ) : (
    <GeneratorEmpty icon={ImageIcon} message="Your AI image will appear here." />
  );

  return (
    <GeneratorShell
      title="AI Image Generator"
      description="Create flyer, product and social images tuned for your brand."
      form={form}
      output={output}
      remaining={result?.remaining ?? null}
    />
  );
}
