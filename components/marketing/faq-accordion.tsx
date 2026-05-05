"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "A proposta que recebo é firme?",
    answer:
      "A proposta é baseada nos dados que nos forneceste e tem validade de 48 horas. É firme — desde que o estado do veículo na inspeção corresponda ao que descreveste. Se a inspeção revelar diferenças significativas (danos não declarados, saúde da bateria muito inferior, etc.), ajustamos o valor antes de fecharmos o negócio. O que não fazemos é renegociar à última hora sem razão: se o carro está como disseste, o valor não muda.",
  },
  {
    question: "Quanto tempo demora todo o processo?",
    answer:
      "Preencher o formulário demora menos de 1 minuto. A nossa avaliação e proposta chegam-te por SMS em menos de 1 hora. Na inspeção presencial, o teste de saúde da bateria pode demorar até 24 horas — é o tempo necessário para uma leitura rigorosa. O pagamento é processado assim que o teste estiver concluído.",
  },
  {
    question: "Onde ficam? Fazem recolha na minha zona?",
    answer:
      "Estamos na zona da Trofa, Porto. Fazemos recolha do veículo no Norte e Centro de Portugal, em morada à tua escolha — seja em casa, no trabalho ou noutro local conveniente. Não precisas de te deslocar.",
  },
  {
    question: "Compram carros com problemas ou avariados?",
    answer:
      "Sim, avaliamos qualquer EV independentemente do estado. Se o carro tiver bateria degradada, danos na carroçaria ou alguma avaria, fazemos na mesma uma proposta. O estado do veículo reflete-se naturalmente no valor — mas nunca recusamos uma avaliação.",
  },
  {
    question: "Quem são vocês?",
    answer:
      "Somos uma equipa especializada exclusivamente em veículos elétricos usados, baseada na Trofa, Porto. O foco total em elétricos permite-nos oferecer avaliações muito mais precisas do que um revendedor generalista.",
  },
  {
    question: "Como avaliam a saúde da bateria?",
    answer:
      "Usamos dados do próprio veículo (SoH — State of Health) combinados com bases de dados de degradação por modelo, quilometragem e historial de carregamentos. Na inspeção presencial fazemos uma leitura direta ao sistema de gestão da bateria (BMS) — daí o processo poder demorar até 24 horas. Não adivinhamos — calculamos. É isso que nos permite fazer propostas firmes.",
  },
];

export function FaqAccordion() {
  return (
    <Accordion className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-base font-medium text-left py-4 hover:no-underline hover:text-primary transition-colors">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
