import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Is the content actually Nigerian-sounding?", a: "Yes. Our AI is tuned to use local references, Pidgin when relevant, and culturally appropriate tone for Nigerian audiences." },
  { q: "Do I need to pay to start?", a: "No. The free plan gives you 20 generations every month, no credit card required." },
  { q: "Can I cancel anytime?", a: "Absolutely. Manage your subscription from your dashboard at any time — no calls, no emails." },
  { q: "Which platforms do you support?", a: "Instagram, WhatsApp, Twitter/X, Facebook, TikTok and LinkedIn copy. Flyers and content calendars too." },
  { q: "Can my whole team use it?", a: "Yes — the Agency plan supports team accounts, multi-brand workspaces and content approval workflows." },
];

export function FAQ() {
  return (
    <section id="faq" className="border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Questions, answered</h2>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
